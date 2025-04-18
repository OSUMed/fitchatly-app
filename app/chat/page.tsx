"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
// Import React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import ChatSidebar from "@/components/chat/chat-sidebar"
import ChatHeader from "@/components/chat/chat-header"
import ChatMessages from "@/components/chat/chat-messages"
import ChatInput from "@/components/chat/chat-input"
// ThemeProvider and Toaster are likely handled by Providers component now
// import { ThemeProvider } from "@/components/theme-provider"
// import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// Definitions (can move to shared types)
const publicChannels = [
    { id: "c1", name: "general", type: "public" },
    { id: "c2", name: "help", type: "public" },
    { id: "c3", name: "random", type: "public" },
    { id: "c4", name: "running", type: "public" },
    { id: "c5", name: "weighttraining", type: "public" },
    { id: "c6", name: "rockclimbing", type: "public" },
    { id: "c7", name: "calisthenics", type: "public" },
]
const privateChannels = [
    { id: "p1", name: "gpt-personal", type: "private" },
    { id: "p2", name: "gpt-strength", type: "private" },
    { id: "p3", name: "gpt-nutrition", type: "private" },
    { id: "p4", name: "gpt-cardio", type: "private" },
]
const allChannels = [...publicChannels, ...privateChannels];

interface FetchedMessage {
  id: string
  content: string
  createdAt: string
  userId: string
  channelId: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

// API fetching functions
const fetchMessages = async (channelId: string): Promise<FetchedMessage[]> => {
  const response = await fetch(`/api/messages/${channelId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const postUserMessage = async (newMessage: { channelId: string; content: string }): Promise<FetchedMessage> => {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newMessage),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// New function to call the gpt-response endpoint
const triggerGptResponse = async (triggerPayload: { channelId: string; content: string }): Promise<FetchedMessage> => {
    console.log("(ChatPage) Calling /api/gpt-response with:", triggerPayload);
    const response = await fetch("/api/gpt-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(triggerPayload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get GPT response' }))
        throw new Error(errorData.error || `Failed to trigger/save GPT response: ${response.status}`);
    }
    console.log("(ChatPage) /api/gpt-response call successful.");
    return response.json(); // Returns the saved AI message
};

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status: authStatus } = useSession() // Renamed status
  const queryClient = useQueryClient() // Get query client instance

  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [isWaitingForGpt, setIsWaitingForGpt] = useState(false); // New state for loading indicator

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login")
    }
  }, [authStatus, router])

  // --- Fetch messages using useQuery --- 
  const { 
    data: messages = [], // Default to empty array
    isLoading: isLoadingMessages,
    isError: isMessagesError,
    error: messagesError 
  } = useQuery<FetchedMessage[], Error>({
    queryKey: ['messages', activeChannel], // Query key includes channel ID
    queryFn: () => fetchMessages(activeChannel!), // Fetch data using helper function
    enabled: !!activeChannel && authStatus === "authenticated", // Only run query if channel is selected and user is authenticated
    staleTime: 1000 * 60 * 1, // Optional: Consider data fresh for 1 minute
    // refetchOnWindowFocus: false, // Optional: Prevent refetch on window focus if desired
  });

  // Show toast on fetch error
  useEffect(() => {
      if (isMessagesError) {
          console.error("Failed to fetch messages:", messagesError);
          toast({ title: "Error", description: messagesError?.message || "Could not load messages.", variant: "destructive" });
      }
  }, [isMessagesError, messagesError, toast]);
  // ----------------------------------------

  // --- Mutation #1: Send User Message --- 
  const { 
    mutate: sendUserMsgMutate,
    isPending: isSendingUserMessage,
  } = useMutation<FetchedMessage, Error, string>({ // Variables: content (string)
    mutationFn: (content: string) => {
      if (!activeChannel) throw new Error("No active channel selected");
      return postUserMessage({ channelId: activeChannel, content });
    },
    onSuccess: (savedUserMessage) => {
      console.log("User message POST successful, invalidating.");
      // Invalidate immediately to show user message
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannel] });

      // Check if it was a GPT channel and trigger the second mutation
      const isGptChannel = activeChannel?.startsWith('private-'); 
      if (isGptChannel && activeChannel) {
          console.log("Private channel detected, triggering gptResponseMutate...");
          setIsWaitingForGpt(true);
          // Pass the *user's* message content and the unique channel ID
          gptResponseMutate({ channelId: activeChannel, content: savedUserMessage.content }); 
      }
    },
    onError: (error) => {
      console.error("Failed to send user message:", error);
      toast({ title: "Error", description: error.message || "Could not send message.", variant: "destructive" });
    },
  });
  // -----------------------------------------

  // --- Mutation #2: Trigger/Save GPT Response --- 
  const { 
      mutate: gptResponseMutate,
      isPending: isGeneratingGptResponse, // Can use this if needed
  } = useMutation<FetchedMessage, Error, { channelId: string; content: string }>({ // Variables: {channelId, content}
      mutationFn: triggerGptResponse,
      onSuccess: (savedGptMessage) => {
          console.log("GPT response fetch/save successful, invalidating again.");
          // Invalidate *again* to show the GPT response
          queryClient.invalidateQueries({ queryKey: ['messages', activeChannel] });
      },
      onError: (error) => {
          console.error("Failed to trigger/save GPT response:", error);
          toast({ title: "Error getting AI Response", description: error.message, variant: "destructive" });
      },
      onSettled: () => {
          // Runs on success or error
          setIsWaitingForGpt(false); // Stop GPT loading indicator
      }
  });
  // -----------------------------------------

  // Show loading skeleton while session is loading
  if (authStatus === "loading") {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
         <div className="flex items-center p-6 rounded-lg shadow-lg bg-card">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 ml-4">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
    )
  }

  // Render chat interface only if authenticated
  if (authStatus === "authenticated") {
    const activeChannelData = allChannels.find(ch => ch.id === activeChannel)
    const activeChannelName = activeChannelData ? activeChannelData.name : null

    return (
      // Removed ThemeProvider and Toaster, handled by Providers component
      <div className="flex h-screen bg-background">
        <ChatSidebar activeChannelId={activeChannel} onChannelSelect={setActiveChannel} session={session} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader channelName={activeChannelName} />
          {/* Pass messages, loading state, and new GPT waiting state */}
          <ChatMessages 
            messages={messages} 
            isLoading={isLoadingMessages} 
            isWaitingForGpt={isWaitingForGpt} // Pass down the new state
            session={session} 
           />
          {/* Pass user message mutate function and its pending state */}
          <ChatInput
            onSendMessage={sendUserMsgMutate} // Use the first mutation's trigger
            isLoading={isSendingUserMessage}  // Use the first mutation's pending state
            activeChannelId={activeChannel}
          />
        </div>
      </div>
    )
  }

  // Fallback case
  return null
}

