import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 60 // 60 seconds max for streaming

// Mock messages for development backdoor
const MOCK_MESSAGES: any[] = []

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // Store the user message in our mock database for development
  if (process.env.NODE_ENV === "development") {
    const userMessage = messages[messages.length - 1]
    if (userMessage && userMessage.role === "user") {
      MOCK_MESSAGES.push(userMessage)
    }
  }

  try {
    // Create a new ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to send SSE events
        function sendEvent(event: string, data: string) {
          controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`))
        }

        // Send initial event
        sendEvent("open", JSON.stringify({ message: "Connection established" }))

        // Send user message event
        const userMessage = messages[messages.length - 1]
        if (userMessage && userMessage.role === "user") {
          sendEvent(
            "userMessage",
            JSON.stringify({
              id: Date.now().toString(),
              content: userMessage.content,
              role: "user",
            }),
          )
        }

        // Stream the AI response
        try {
          // Log the API key format - this might help debug issues
          const apiKey = process.env.OPENAI_API_KEY || '';
          const keyType = apiKey.startsWith('sk-proj-') ? 'Project-scoped key' : 
                         apiKey.startsWith('sk-') ? 'Standard key' :
                         'Invalid key format';
          
          console.log("Starting OpenAI API request with model: gpt-3.5-turbo")
          console.log("API key type:", keyType);
          console.log("API key preview:", apiKey ? 
            `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}` : 
            "NOT CONFIGURED")
          
          // Skip the ai library and use fetch directly with streaming enabled
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: messages.map((m: {role: string; content: string}) => ({ role: m.role, content: m.content })),
              temperature: 0.7,
              max_tokens: 1000,
              stream: true  // Enable streaming
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }
          
          // Manual streaming implementation
          let collectedResponse = "";
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error("Failed to get reader from response");
          }
          
          let lastChunk = "";
          
          // Process the stream chunks
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Decode the chunk and split by lines
            const chunk = decoder.decode(value, { stream: true });
            const lines = (lastChunk + chunk).split("\n");
            lastChunk = lines.pop() || "";
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                
                // Skip the [DONE] message
                if (data === "[DONE]") continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content;
                  
                  if (content) {
                    console.log("Content chunk:", content);
                    collectedResponse += content;
                    
                    // Send the chunk to the client
                    sendEvent(
                      "chunk",
                      JSON.stringify({
                        content: content,
                        role: "assistant",
                      }),
                    );
                  }
                } catch (e) {
                  console.error("Error parsing chunk:", e);
                }
              }
            }
          }
          
          console.log("Stream completed, response length:", collectedResponse.length);
          
          // If no response was collected, send a helpful message
          if (collectedResponse.length === 0) {
            console.warn("No response collected from OpenAI API - check your API key and billing status")
            collectedResponse = "I'm having trouble connecting to my brain right now. This might be due to:\n\n" +
                               "1. API key configuration issues\n" +
                               "2. Your OpenAI account needs billing verification\n" +
                               "3. The API is experiencing high traffic\n\n" +
                               "Please try again later or check the API key settings."
          }
          
          // Send completion event
          sendEvent(
            "done",
            JSON.stringify({
              id: Date.now().toString(),
              content: collectedResponse,
              role: "assistant",
            }),
          )
        } catch (error: any) {
          console.error("Error generating response:", error)
          sendEvent("error", JSON.stringify({ 
            message: "Error generating response", 
            details: error.message || "Unknown error occurred"
          }))
        }

        // Close the stream
        controller.close()
      },
    })

    // Return the stream with appropriate headers for SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

