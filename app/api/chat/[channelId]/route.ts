import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 60 // 60 seconds max for streaming

// Store messages by channel and session
const MOCK_MESSAGES: Record<string, any[]> = {
  "1": [], // general channel
  "2": [], // help channel
  "3": [], // random channel
}

// Store pending messages by session ID
const PENDING_MESSAGES: Record<string, any[]> = {}

// Remove the GET handler entirely as we won't use SSE
// export async function GET(req: NextRequest, { params }: { params: { channelId: string } }) { ... }

// Modify POST to handle the full request/response
export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const { channelId } = await Promise.resolve(params)
  const { messages } = await req.json()

  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API Key Status:", apiKey ? "Configured" : "NOT CONFIGURED");

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "OpenAI API key not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Store user message (optional, for dev context)
  if (process.env.NODE_ENV === "development") {
    storeUserMessage(channelId, messages[messages.length - 1]);
  }

  try {
    const previousMessages = await fetchPreviousMessages(channelId);
    const contextualMessages = [...previousMessages, ...messages].map((msg) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    console.log("Sending request to OpenAI with messages:", JSON.stringify(contextualMessages));

    // Call OpenAI directly, without streaming
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: contextualMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false, // Important: Disable streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Received response from OpenAI:", JSON.stringify(responseData));

    const aiMessageContent = responseData.choices[0]?.message?.content;

    if (!aiMessageContent) {
      console.error("No content found in OpenAI response:", responseData);
      throw new Error("No content received from AI");
    }

    // Store AI message (optional)
    if (process.env.NODE_ENV === "development") {
      storeMessage(channelId, aiMessageContent, "assistant");
    }

    // Return the AI response directly
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: { 
          id: responseData.id || Date.now().toString(), // Use OpenAI ID or generate one
          role: "assistant", 
          content: aiMessageContent 
        } 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in chat API:", error);
    // Log the error cause if available
    if (error instanceof Error && error.cause) {
        console.error("Error cause:", error.cause);
    }
    return new Response(
      JSON.stringify({ error: "Failed to process chat request", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Keep helper functions, but remove createSSEStream
// function createSSEStream(...) { ... }

// Mock function to store user message (simplified)
function storeUserMessage(channelId: string, userMessage: any) {
  if (userMessage && userMessage.role === "user") {
    if (!MOCK_MESSAGES[channelId]) {
      MOCK_MESSAGES[channelId] = []
    }
    const formattedContent = typeof userMessage.content === 'string' ? userMessage.content : JSON.stringify(userMessage.content || "");
    MOCK_MESSAGES[channelId].push({
      role: userMessage.role,
      content: formattedContent,
      id: userMessage.id || Date.now().toString()
    })
    console.log(`Storing user message in channel ${channelId}: ${formattedContent.substring(0, 50)}...`);
  }
}

// Mock function to fetch previous messages
async function fetchPreviousMessages(channelId: string) {
  // In a real app, you would fetch from your database
  // For development, return our mock messages
  if (process.env.NODE_ENV === "development") {
    return MOCK_MESSAGES[channelId] || []
  }
  return []
}

// Mock function to store messages
async function storeMessage(channelId: string, content: any, role: "user" | "assistant") {
  // For development, store in our mock database
  if (process.env.NODE_ENV === "development") {
    if (!MOCK_MESSAGES[channelId]) {
      MOCK_MESSAGES[channelId] = []
    }
    
    // Ensure content is a string before storing
    const formattedContent = typeof content === 'string' ? content : 
                            (content === null || content === undefined) ? "" : 
                            JSON.stringify(content);
    
    MOCK_MESSAGES[channelId].push({ 
      role, 
      content: formattedContent, 
      id: Date.now().toString() 
    })
    
    console.log(`Storing ${role} message in channel ${channelId}: ${formattedContent.substring(0, 50)}...`)
  }
}

// Function to clean up malformed messages
function cleanupMalformedMessages(channelId: string) {
  if (!MOCK_MESSAGES[channelId]) return;
  
  console.log(`Cleaning up channel ${channelId}, before: ${MOCK_MESSAGES[channelId].length} messages`);
  
  // Filter out messages with empty object content
  MOCK_MESSAGES[channelId] = MOCK_MESSAGES[channelId].filter(msg => {
    // If content is an empty object, filter it out
    if (typeof msg.content === 'object' && 
        msg.content !== null && 
        Object.keys(msg.content).length === 0) {
      console.log(`Removing malformed message with empty object content`);
      return false;
    }
    
    // If content is not a string, convert it
    if (typeof msg.content !== 'string') {
      console.log(`Converting non-string content to string: ${typeof msg.content}`);
      msg.content = msg.content === null || msg.content === undefined 
        ? "Unknown message" 
        : JSON.stringify(msg.content);
    }
    
    return true;
  });
  
  console.log(`Cleanup complete, after: ${MOCK_MESSAGES[channelId].length} messages`);
}

