import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { auth } from "@/auth";
// Use Vercel AI SDK
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const prisma = new PrismaClient();

// Initialize OpenAI provider using Vercel AI SDK
const openai = createOpenAI();

// Define GPT channel IDs and a user ID for the assistant
// TODO: Share these constants or derive them more robustly
const GPT_CHANNEL_IDS = new Set(["p1", "p2", "p3", "p4"]);
const GPT_USER_ID = "gpt-assistant-user-id"; // Ensure this user exists (via seed script)

// Helper function using Vercel AI SDK (Could be moved to a shared lib)
async function getGptResponse(userMessage: string, channelId: string): Promise<string | null> {
    // TODO: Customize system prompt based on channelId (gpt-strength, gpt-nutrition, etc.)
    const systemPrompt = "You are a helpful AI fitness assistant.";
    console.log(`(gpt-response route) Generating text for channel ${channelId}...`);

    try {
        const { text } = await generateText({
            model: openai('gpt-3.5-turbo'),
            system: systemPrompt,
            prompt: userMessage,
            maxTokens: 150,
        });

        console.log("(gpt-response route) Vercel AI SDK response received.");
        console.log("(gpt-response route) GPT Response Content:", text);
        return text.trim() || null;

    } catch (error) {
        console.error("(gpt-response route) Vercel AI SDK text generation failed:", error);
        // Return a user-friendly error message that can be saved as the AI response
        return "Sorry, I encountered an error trying to respond."; 
    }
}

// POST /api/gpt-response
export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse request body for original user message content and channelId
    const body = await request.json();
    const { content: userMessageContent, channelId } = body;

    // 3. Validate input
    if (!userMessageContent || !channelId) {
      return NextResponse.json({ error: 'Message content and channel ID are required' }, { status: 400 });
    }
    if (!channelId.startsWith('private-')) {
        return NextResponse.json({ error: 'Invalid channel ID pattern for GPT response' }, { status: 400 });
    }

    // 4. Get the GPT response
    const gptContent = await getGptResponse(userMessageContent, channelId);

    if (!gptContent) {
      console.log("(gpt-response route) No GPT content generated.");
      // Decide what to return. Maybe an empty success or an error?
      // Let's return an error for now, as we expect a response.
      return NextResponse.json({ error: 'AI did not generate a response.' }, { status: 500 });
    }

    // 5. Save the GPT response to the database
    try {
      const savedGptMessage = await prisma.message.create({
        data: {
          content: gptContent,
          channelId: channelId,
          userId: GPT_USER_ID, // Use the dedicated GPT user ID
        },
         // Include user details for consistency, though we know it's the AI
         include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
      });
      console.log(`(gpt-response route) GPT response saved for channel ${channelId}`);
      // 6. Return the newly saved AI message object
      return NextResponse.json(savedGptMessage, { status: 201 });

    } catch (dbError) {
      console.error("(gpt-response route) Failed to save GPT response to DB:", dbError);
      // This could be the foreign key error if the seed wasn't run/user doesn't exist
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error("(gpt-response route) Error processing GPT response request:", error);
     if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 