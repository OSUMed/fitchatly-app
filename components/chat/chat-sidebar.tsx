"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Activity, Hash, Star, StarOff, LogOut, ChevronDown, ChevronRight, User as UserIcon, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"

// Define Channel interface first
interface Channel {
  id: string
  name: string
  type: 'public' | 'private'
}

// Define Channels based on requirement.md, using the Channel type
const publicChannels: Channel[] = [
  { id: "c1", name: "general", type: "public" },
  { id: "c2", name: "help", type: "public" },
  { id: "c3", name: "random", type: "public" },
  { id: "c4", name: "running", type: "public" },
  { id: "c5", name: "weighttraining", type: "public" },
  { id: "c6", name: "rockclimbing", type: "public" },
  { id: "c7", name: "calisthenics", type: "public" },
]

// Define assistants conceptually, without hardcoded IDs
const assistantChannels = [
  { type: "private", name: "gpt-personal", assistantType: "personal" },
  { type: "private", name: "gpt-strength", assistantType: "strength" },
  { type: "private", name: "gpt-nutrition", assistantType: "nutrition" },
  { type: "private", name: "gpt-cardio", assistantType: "cardio" },
]

// Combine for rendering list (without hardcoded IDs for private)
const allDisplayChannels = [
    ...publicChannels,
    ...assistantChannels.map((ch, index) => ({ ...ch, id: `assistant-${index}` })) // Use temporary unique keys for React list rendering
]; 

interface ChatSidebarProps {
  activeChannelId: string | null
  onChannelSelect: (channelId: string) => void
  session: Session | null
}

export default function ChatSidebar({ activeChannelId, onChannelSelect, session }: ChatSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<string[]>([])
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true)
  const [isPublicChannelsOpen, setIsPublicChannelsOpen] = useState(true)
  const [isPrivateChannelsOpen, setIsPrivateChannelsOpen] = useState(true)

  useEffect(() => {
    // Fetch favorites if user is logged in
    const fetchFavorites = async () => {
      if (!session) return; // Don't fetch if not logged in
      try {
        // TODO: Replace with actual API call based on Prisma schema
        // This endpoint likely needs the user ID from the session
        const response = await fetch("/api/favorites") // Assuming this fetches favorites for the logged-in user
        if (response.ok) {
          const data = await response.json()
          // Assuming API returns [{ channelId: '...' }, ...]
          setFavoriteChannelIds(data.map((fav: any) => fav.channelId))
        } else {
           console.error("Failed to fetch favorites, status:", response.status)
           // Optionally show a toast, but maybe fail silently for now
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error)
        // Optionally show a toast
      }
    }

    fetchFavorites()

    // If no channel is active, select the first public channel ('general') by default
    if (!activeChannelId && session) {
        onChannelSelect('c1'); // Select general channel ID
    }

  }, [session, activeChannelId, onChannelSelect])

  const toggleFavorite = async (channelId: string) => {
    if (!session) {
      toast({ title: "Authentication Required", description: "Please log in to manage favorites.", variant: "destructive" })
      return
    }
    if (channelId.startsWith('assistant-')) { // Prevent favoriting assistants for now
         toast({ title: "Info", description: "Favoriting AI assistants is not supported yet.", variant: "default" })
         return;
    }
    const isFavorite = favoriteChannelIds.includes(channelId)
    const optimisticNewFavorites = isFavorite
        ? favoriteChannelIds.filter((id) => id !== channelId)
        : [...favoriteChannelIds, channelId];

    // Optimistic UI update
    setFavoriteChannelIds(optimisticNewFavorites);

    try {
      const method = isFavorite ? "DELETE" : "POST"
      // TODO: Replace with actual API call based on Prisma schema
      // This endpoint likely needs the user ID from the session passed in the body or inferred server-side
      const response = await fetch(`/api/favorites/${channelId}`, { // Assuming endpoint takes channelId
        method,
        // body: JSON.stringify({ userId: session.user.id }), // Example if needed
        // headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        // Revert optimistic update on failure
        setFavoriteChannelIds(favoriteChannelIds);
        toast({ title: "Error", description: "Failed to update favorites.", variant: "destructive" })
      } else {
         toast({
            title: isFavorite ? "Removed from favorites" : "Added to favorites",
         })
      }
    } catch (error) {
      // Revert optimistic update on error
      setFavoriteChannelIds(favoriteChannelIds);
      console.error("Failed to toggle favorite:", error)
      toast({ title: "Error", description: "Failed to update favorites.", variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error("Failed to logout:", error)
      toast({ title: "Logout Error", description: "Failed to sign out.", variant: "destructive" })
    }
  }

  const user = session?.user

  // Helper function to render a channel item
  const renderChannelItem = (channel: any, isFavoriteSection: boolean = false) => {
    const { id, name, type, assistantType } = channel;
    let targetChannelId = id; // Default to the public channel ID
    
    // For private assistant channels, generate the dynamic ID on click
    if (type === 'private' && assistantType && session?.user?.id) {
        targetChannelId = generatePrivateChannelId(session.user.id, assistantType);
    }

    const isActive = activeChannelId === targetChannelId;
    // Determine Icon: Star for favorites, Hash for public, null for private (emoji handles it)
    const Icon = isFavoriteSection ? Star : (type === 'public' ? Hash : null);
    const activeBg = isActive
        ? (isFavoriteSection ? "bg-gradient-to-r from-accent/20 to-accent/10" : (type === 'public' ? "bg-gradient-to-r from-primary/20 to-secondary/10" : "bg-gradient-to-r from-green-500/10 to-teal-500/10"))
        : "";
    const activeText = isActive
        ? (isFavoriteSection ? "text-accent" : (type === 'public' ? "text-primary" : "text-green-600"))
        : "";
    const iconColor = isActive
        ? activeText
        : (isFavoriteSection ? "text-accent/70" : "text-muted-foreground");

    // Add emoji prefix for private channels
    let channelDisplayName = name;
    if (type === 'private') {
        switch(name) {
            case 'gpt-personal': channelDisplayName = `🤖 ${name}`; break;
            case 'gpt-strength': channelDisplayName = `💪 ${name}`; break;
            case 'gpt-nutrition': channelDisplayName = `🍎 ${name}`; break;
            case 'gpt-cardio': channelDisplayName = `❤️ ${name}`; break;
            default: break;
        }
    }

    return (
      <div
        key={id} // Use the temporary display ID for list keys
        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 hover-lift ${
          isActive
            ? `${activeBg} ${activeText} font-medium shadow-sm`
            : "hover:bg-primary/5" // Use a subtle hover for non-active
        }`}
        onClick={() => onChannelSelect(targetChannelId)}
      >
        <div className="flex items-center overflow-hidden">
          {/* Conditionally render Icon - only if it's not null */}
          {Icon && <Icon className={`h-4 w-4 mr-2 flex-shrink-0 ${iconColor}`} />}
          {/* Remove placeholder div, rely on emoji width */}
          {/* {!Icon && <div className=\"w-4 mr-2 flex-shrink-0\" />} */}
          <span className="truncate font-medium">{channelDisplayName}</span>
        </div>
        {/* Show star toggle only for non-favorite section items */}
        {!isFavoriteSection && session && type === 'public' && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 ml-1 flex-shrink-0 ${favoriteChannelIds.includes(id) ? 'opacity-100' : ''}`} // Make star always visible if favorited
            onClick={(e) => {
              e.stopPropagation() // Prevent channel selection when clicking star
              toggleFavorite(id)
            }}
          >
            {favoriteChannelIds.includes(id) ? (
              <Star className="h-4 w-4 text-accent" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    );
  };

  // Filter favorites based on *public* channels only for now
  const favoriteChannelsList = publicChannels.filter((channel) => favoriteChannelIds.includes(channel.id));
  const publicChannelsList = publicChannels;
  const privateChannelsList = assistantChannels;

  return (
    <div className="w-64 border-r border-border bg-background/95 backdrop-blur-sm flex flex-col h-full shadow-md">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-extrabold text-lg tracking-tight flex items-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
           <MessageSquare className="h-5 w-5 mr-2 text-primary" />
           FitChatly AI
        </h2>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {session && favoriteChannelsList.length > 0 && (
          <Collapsible open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen} className="mb-3">
            <CollapsibleTrigger asChild>
               <button className="flex items-center w-full p-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/5">
                {isFavoritesOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                Favorites
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 pl-3">
              {favoriteChannelsList.map(channel => renderChannelItem(channel, true))}
            </CollapsibleContent>
          </Collapsible>
        )}
         {session && favoriteChannelsList.length > 0 && <Separator className="my-2 bg-border/50"/>}

        <Collapsible open={isPublicChannelsOpen} onOpenChange={setIsPublicChannelsOpen} className="mb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/5">
              <div className="flex items-center">
                {isPublicChannelsOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                Channels
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1 pl-3">
            {publicChannelsList.map(channel => renderChannelItem(channel))}
          </CollapsibleContent>
        </Collapsible>

        <Separator className="my-2 bg-border/50"/>

        <Collapsible open={isPrivateChannelsOpen} onOpenChange={setIsPrivateChannelsOpen} className="mb-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center w-full p-2 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/5">
                {isPrivateChannelsOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                AI Assistants
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 pl-3">
              {privateChannelsList.map(channel => renderChannelItem(channel))}
            </CollapsibleContent>
        </Collapsible>
      </ScrollArea>

      <Separator className="bg-border/50" />

      <div className="p-3 border-t border-border mt-auto bg-background/90 backdrop-blur-sm">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
               <UserIcon className="h-6 w-6 mr-2 rounded-full bg-muted text-muted-foreground p-1 flex-shrink-0"/>
              <span className="text-sm font-medium truncate text-foreground">{user.name ?? user.email ?? "User"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="text-center">
             <Button variant="outline" size="sm" onClick={() => router.push('/login')}>Login</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to generate unique private channel ID
const generatePrivateChannelId = (userId: string, assistantType: string): string => {
    return `private-${userId}-${assistantType}`;
};

