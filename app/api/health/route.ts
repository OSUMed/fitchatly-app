import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // You could add more sophisticated checks here later if needed
  // (e.g., check database connection)
  console.log("Health check endpoint hit");
  return NextResponse.json({ status: 'ok' }, { status: 200 });
} 