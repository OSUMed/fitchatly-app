"use client"

import { useState } from "react"
import { Hash, Info, Settings, Activity, Dumbbell, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Removed mock data and channel fetching logic

interface ChatHeaderProps {
  channelName: string | null
}

export default function ChatHeader({ channelName }: ChatHeaderProps) {
  const [showSettings, setShowSettings] = useState(false)

  if (!channelName) {
    return (
      <div className="h-16 border-b border-border flex items-center px-6 shadow-sm bg-white/95 backdrop-blur-sm">
        <h2 className="font-semibold text-lg text-muted-foreground">Select a channel</h2>
      </div>
    )
  }

  const isPrivate = channelName.startsWith('gpt-');
  const Icon = isPrivate ? UserIcon : Hash;

  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-6 shadow-sm bg-white/95 backdrop-blur-sm">
      <div className="flex items-center min-w-0">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mr-3 flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-semibold text-lg tracking-tight truncate" title={channelName}>{channelName}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs hidden md:flex items-center border-primary/20 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
        >
          <Dumbbell className="h-3 w-3 mr-1" />
          Workout Mode
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full touch-target hover:bg-primary/10 hover:text-primary"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

