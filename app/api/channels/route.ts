import { NextResponse } from "next/server"

// Mock channels data
const channels = [
  {
    id: "1",
    name: "general",
    description: "General discussion",
  },
  {
    id: "2",
    name: "help",
    description: "Get help with your questions",
  },
  {
    id: "3",
    name: "random",
    description: "Random topics and fun",
  },
]

export async function GET() {
  // In a real app, you would fetch channels from the database
  return NextResponse.json(channels)
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ message: "Channel name is required" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Create the channel in the database
    // 2. Return the created channel

    // For now, we'll simulate creating a channel
    const newChannel = {
      id: Date.now().toString(),
      name,
      description: description || "",
    }

    return NextResponse.json(newChannel, { status: 201 })
  } catch (error) {
    console.error("Create channel error:", error)
    return NextResponse.json({ message: "An error occurred while creating the channel" }, { status: 500 })
  }
}

