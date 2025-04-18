import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'
// Import auth to get user session
import { auth } from "@/auth";

const prisma = new PrismaClient()

// Define GPT constants here as well (or move to shared file)
const GPT_CHANNEL_IDS = new Set(["p1", "p2", "p3", "p4"]);
const GPT_USER_ID = "gpt-assistant-user-id";

// GET /api/messages/[channelId]
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const channelId = params.channelId;

  // 1. Get user session
  const session = await auth();
  if (!session?.user?.id) {
      // Allow fetching public channels even if not logged in?
      // For now, let's require login for all fetches.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;

  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
  }

  try {
    // 2. Determine filter based on channel type
    let whereClause: any = {
        channelId: channelId,
    };

    if (GPT_CHANNEL_IDS.has(channelId)) {
        // Private GPT Channel: Filter by current user OR AI assistant
        console.log(`Fetching messages for GPT channel ${channelId} for user ${currentUserId}`);
        whereClause = {
            ...whereClause,
            OR: [
                { userId: currentUserId },
                { userId: GPT_USER_ID }
            ]
        };
    } else {
        // Public Channel: No additional user filtering needed (fetches all)
        console.log(`Fetching messages for public channel ${channelId}`);
    }

    // 3. Fetch messages with the determined filter
    const messages = await prisma.message.findMany({
      where: whereClause, // Use the constructed where clause
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    const sortedMessages = messages.reverse()
    return NextResponse.json(sortedMessages)

  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 