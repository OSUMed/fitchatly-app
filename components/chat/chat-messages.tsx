"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, Smile, Heart, ThumbsUp, Award, Dumbbell, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Session } from "next-auth"

// Define the type for messages fetched from our API
interface FetchedMessage {
  id: string
  content: string
  createdAt: string // Prisma Dates become strings in JSON
  userId: string
  channelId: string // Might be useful later
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ChatMessagesProps {
  messages: FetchedMessage[]
  isLoading: boolean
  isWaitingForGpt: boolean // Add new prop for GPT loading state
  session: Session | null // Pass session for user identification
}

export default function ChatMessages({ messages, isLoading, isWaitingForGpt, session }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, string[]>>({}) // Local reactions for now
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<Record<string, boolean>>({})

  // Scroll to bottom helper
  const scrollToBottom = () => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
        // Find the viewport element within the ScrollArea component
        // Radix UI typically gives the viewport a data attribute: [data-radix-scroll-area-viewport]
        const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            // Use setTimeout to ensure scroll happens after DOM update
            setTimeout(() => {
                // Scroll the viewport element
                viewport.scrollTop = viewport.scrollHeight;
                console.log("Scrolled to bottom"); // Add log for debugging
            }, 0);
        } else {
             console.warn("ScrollArea viewport not found for scrolling.");
             // Fallback: try scrolling the root element anyway
             setTimeout(() => {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }, 0);
        }
    }
  };

  // Scroll to bottom when messages prop changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when activeChannelId changes - DISABLED
  useEffect(() => {
    // This effect is now disabled as fetching is handled by the parent.
    // Removed internal fetching logic to fix linter errors.
  }, []); // Empty dependency array

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const addReaction = (messageId: string, emoji: string) => {
    // This is local-only reaction state
    setReactions((prev) => {
      const messageReactions = prev[messageId] || []
      // Simple toggle for demo purposes - click again to remove (optional)
      if (messageReactions.includes(emoji)) {
        // return { ...prev, [messageId]: messageReactions.filter(e => e !== emoji) };
        return prev // Prevent duplicates for now
      }
      return {
        ...prev,
        [messageId]: [...messageReactions, emoji],
      }
    })
  }

  const toggleAdvancedOptions = (messageId: string) => {
    setShowAdvancedOptions((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const emojis = ["👍", "❤️", "💪", "🔥", "👏", "🏆"]
  const currentUser = session?.user

  return (
    // Pass scrollAreaRef directly to ScrollArea, remove viewportRef
    <ScrollArea className="flex-1 px-6 py-6 bg-gradient-to-br from-background to-primary/5" ref={scrollAreaRef}>
      <div className="space-y-6 max-w-3xl mx-auto pb-4">
        {/* Initial loading state - Skeletons Removed for now */}
        {/* 
        {isLoading && messages.length === 0 && (
           Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={cn("flex items-start gap-4", index % 2 === 0 ? "justify-start" : "justify-end")}>
              {index % 2 === 0 && (
                 <Skeleton className=\"h-10 w-10 rounded-full border-2 border-secondary shadow-md\" />
              )}
               <div className={cn("space-y-2 rounded-xl p-4 max-w-[85%] shadow-md", index % 2 === 0 ? \"glass\" : \"bg-accent/80\")}>
                <Skeleton className=\"h-4 w-[250px]\" />
                <Skeleton className=\"h-4 w-[200px]\" />
              </div>
              {index % 2 !== 0 && (
                <Skeleton className=\"h-10 w-10 rounded-full border-2 border-accent shadow-md\" />
              )}
            </div>
          ))
        )}
        */}

        {/* Render actual messages */}
        {!isLoading && messages.map((message) => {
          const isCurrentUser = message.userId === currentUser?.id;
          return (
            <div key={message.id}>
              <div
                className={cn(
                  "flex items-start gap-4 group",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {/* Render avatar for non-current users */}
                {!isCurrentUser && (
                  <Avatar className="h-10 w-10 border-2 border-primary shadow-md">
                    <AvatarImage src={message.user.image ?? undefined} alt={message.user.name ?? 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                      {/* Show initials or generic icon */}
                      {message.user.name
                        ? message.user.name.substring(0, 2).toUpperCase()
                        : <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "rounded-xl p-3 max-w-[85%] shadow-md relative group", // Added relative and group
                    isCurrentUser
                      ? "bg-gradient-to-r from-accent via-accent/90 to-accent/80 text-white asymmetric-card"
                      : "glass asymmetric-card border border-border/30 bg-white/80 dark:bg-zinc-900/80" // Adjusted non-user style
                  )}
                >
                   {/* Display user name above message for non-current users */}
                   {!isCurrentUser && (
                     <div className="text-xs font-semibold mb-1 text-primary">
                       {message.user.name || 'Anonymous'}
                     </div>
                   )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

                  {/* Actions (Copy, React, etc.) appear on hover */}
                   <div className="absolute -bottom-4 right-1 md:bottom-0 md:right-auto md:left-full md:ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full touch-target bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 shadow-sm"
                        title="Copy"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-full touch-target bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 shadow-sm"
                              title="React">
                            <Smile className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1 flex gap-1 rounded-full shadow-lg bg-white dark:bg-zinc-800 border-none">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              className="text-lg p-1 hover:scale-125 transition-transform duration-150 touch-target"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      {/* Remove advanced options for now? Or keep? Let's remove for simplicity */}
                      {/*
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full touch-target bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700 shadow-sm"
                        onClick={() => toggleAdvancedOptions(message.id)}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button> 
                      */}
                  </div>
                </div>

                 {/* Render avatar for current user */}
                {isCurrentUser && (
                  <Avatar className="h-10 w-10 border-2 border-accent shadow-md">
                    <AvatarImage src={currentUser?.image ?? undefined} alt={currentUser?.name ?? 'Me'} />
                    <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white font-bold">
                       {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Emoji reactions display */}
               <div
                 className={cn("flex gap-1 mt-1.5 px-1",
                             isCurrentUser ? "justify-end mr-14" : "justify-start ml-14")}
               >
                 {reactions[message.id]?.map((emoji, index) => (
                   <span key={index} className="bg-white/80 dark:bg-zinc-700/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs shadow-sm cursor-default select-none">
                     {emoji}
                   </span>
                 ))}
               </div>
              {/* Remove Advanced options panel display */}
            </div>
          )
        })}

        {/* Placeholder for when messages are loaded but empty */}
        {!isLoading && messages.length === 0 && !isWaitingForGpt && (
          <div className="text-center text-muted-foreground py-10">
            <p>Be the first to send a message!</p>
          </div>
        )}

        {/* GPT Loading Indicator */}
        {isWaitingForGpt && (
             <div className="flex items-center justify-start gap-4 pl-1 pt-4 fade-in">
               <Avatar className="h-10 w-10 border-2 border-primary shadow-md">
                 {/* You might want a dedicated AI avatar or use initials */}
                 <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                   AI
                 </AvatarFallback>
               </Avatar>
               <div className="glass asymmetric-card border border-border/30 bg-white/80 dark:bg-zinc-900/80 rounded-xl p-3 shadow-md flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
                 <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
               </div>
             </div>
        )}
      </div>
    </ScrollArea>
  )
}

