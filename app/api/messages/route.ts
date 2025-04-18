import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'
// Import auth directly from your auth config file
import { auth } from "@/auth"

const prisma = new PrismaClient()

// POST /api/messages
export async function POST(request: NextRequest) {
  // 1. Get user session using the auth() helper
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user) {
      console.warn("POST /api/messages called without session.user");
      return NextResponse.json({ error: 'User data missing from session' }, { status: 401 });
  }

  const userId = session.user.id

  try {
    // 2. Parse request body
    const body = await request.json()
    const { channelId, content } = body

    // 3. Validate input
    if (!channelId || !content) {
      return NextResponse.json({ error: 'Channel ID and content are required' }, { status: 400 })
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    // Optional: Validate channel existence (can add later if needed)
    // const channelExists = await prisma.channel.findUnique({ where: { id: channelId } });
    // if (!channelExists) {
    //     return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    // }

    // --- Auto-create channel if it's a new private one --- 
    if (channelId.startsWith('private-')) {
        const existingChannel = await prisma.channel.findUnique({
            where: { id: channelId },
        });
        if (!existingChannel) {
            console.log(`Private channel ${channelId} not found, creating...`);
            try {
                await prisma.channel.create({
                    data: {
                        id: channelId, // Use the generated unique ID
                        // Extract assistant type from ID for potential use?
                        name: channelId, // Or generate a more user-friendly name?
                        type: 'private',
                    },
                });
                console.log(`Private channel ${channelId} created.`);
            } catch (createError) {
                // Handle potential race conditions or other creation errors
                console.error(`Failed to auto-create channel ${channelId}:`, createError);
                // Decide if we should proceed or return an error
                return NextResponse.json({ error: 'Failed to initialize chat channel' }, { status: 500 });
            }
        }
    }
    // ------------------------------------------------------

    // 4. Create the user's message
    const newMessage = await prisma.message.create({
      data: {
        content: content,
        channelId: channelId,
        userId: userId,
      },
      // Include user details in the response for frontend use
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

    // 5. Return the user's created message immediately
    return NextResponse.json(newMessage, { status: 201 }) // 201 Created status

  } catch (error) {
    console.error("Failed to send user message:", error)
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  } finally {
    // Prisma disconnect can likely be uncommented here now
    await prisma.$disconnect()
  }
} 