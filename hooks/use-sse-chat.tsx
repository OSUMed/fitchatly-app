"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { nanoid } from "nanoid"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
}

interface UseSseChatOptions {
  api: string
  initialMessages?: Message[]
  onError?: (error: Error) => void
}

export function useSseChat({ api, initialMessages = [], onError }: UseSseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const pendingMessageRef = useRef<string>("")

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!input.trim() || isLoading) return

      const userMessage: Message = {
        id: nanoid(),
        content: input,
        role: "user",
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setError(null)

      pendingMessageRef.current = userMessage.content

      try {
        // Send message via POST and get the full response directly
        const response = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Send only necessary messages for context
            messages: [...messages, userMessage].slice(-10).map(({ content, role }) => ({ content, role })), // Example: send last 10 messages
          }),
        })

        if (!response.ok) {
          let errorDetails = "Unknown error";
          try {
            const errorData = await response.json();
            errorDetails = errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
          } catch (jsonError) {
            // If response is not JSON, use the status text
            errorDetails = `HTTP error! status: ${response.status} - ${response.statusText}`;
          }
          throw new Error(errorDetails);
        }

        const responseData = await response.json();
        console.log("Received API response:", responseData);

        if (!responseData.success || !responseData.message) {
          throw new Error("Invalid response format from API");
        }

        const assistantMessage: Message = responseData.message;

        // Add the complete assistant message at once
        setMessages((prev) => [...prev, assistantMessage])

      } catch (err) {
        console.error("Error sending message:", err);
        const errorMessage = err instanceof Error ? err : new Error("An unknown error occurred");
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [api, input, isLoading, messages, onError],
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  }
}

