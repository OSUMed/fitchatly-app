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

export async function GET(req: Request, { params }: { params: { channelId: string } }) {
  const channelId = params.channelId

  // Find the channel by ID
  const channel = channels.find((c) => c.id === channelId)

  if (!channel) {
    return NextResponse.json({ message: "Channel not found" }, { status: 404 })
  }

  return NextResponse.json(channel)
}

export async function PUT(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const channelId = params.channelId
    const { name, description } = await req.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ message: "Channel name is required" }, { status: 400 })
    }

    // In a real app, you would:
    // 1. Find the channel in the database
    // 2. Update the channel
    // 3. Return the updated channel

    // For now, we'll simulate updating a channel
    const updatedChannel = {
      id: channelId,
      name,
      description: description || "",
    }

    return NextResponse.json(updatedChannel)
  } catch (error) {
    console.error("Update channel error:", error)
    return NextResponse.json({ message: "An error occurred while updating the channel" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { channelId: string } }) {
  const channelId = params.channelId

  // In a real app, you would:
  // 1. Find the channel in the database
  // 2. Delete the channel

  // For now, we'll simulate deleting a channel
  return NextResponse.json({ message: "Channel deleted successfully" }, { status: 200 })
}

