import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Log API key status (first 5 chars and last 3 chars only)
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("Test endpoint - API key status:", apiKey ? 
      `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}` : 
      "NOT CONFIGURED");

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Simple non-streaming completion using direct fetch
    console.log("Calling OpenAI API directly with fetch...");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello and tell me the current date in a single sentence." }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const completion = await response.json();
    console.log("API Response:", JSON.stringify(completion));
    
    return NextResponse.json({ 
      success: true, 
      message: completion.choices[0]?.message?.content || "No response received",
      raw_response: completion
    });
  } catch (error: any) {
    console.error("Test endpoint error:", error);
    return NextResponse.json({ 
      error: "OpenAI API error", 
      details: error.message || "Unknown error", 
      stack: error.stack 
    }, { status: 500 });
  }
} 