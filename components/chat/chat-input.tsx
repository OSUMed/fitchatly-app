"use client"

import type React from "react"

import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Dumbbell, Image, Mic, Loader2 } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  isLoading: boolean
  activeChannelId: string | null
}

export default function ChatInput({ onSendMessage, isLoading, activeChannelId }: ChatInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || isLoading || !activeChannelId) {
      return;
    }
    onSendMessage(content);
    setInputValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const content = inputValue.trim();
       if (content && !isLoading && activeChannelId) {
         e.currentTarget.form?.requestSubmit();
       }
    }
  }

  const isDisabled = isLoading || !activeChannelId;

  return (
    <div className="p-4 border-t border-border bg-white/95 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <Textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder={activeChannelId ? "Send a message..." : "Select a channel first"}
          className="min-h-[44px] max-h-40 resize-none text-sm rounded-lg shadow-sm flex-1 border-border/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
          rows={1}
          disabled={isDisabled}
          aria-label="Chat message input"
        />

        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isDisabled}
          className="rounded-lg shadow-sm touch-target w-11 h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white flex-shrink-0"
          aria-label="Send message"
        >
           {isLoading ? (
             <Loader2 className="h-5 w-5 animate-spin" />
           ) : (
             <Send className="h-5 w-5" />
           )}
        </Button>
      </form>
    </div>
  )
}

