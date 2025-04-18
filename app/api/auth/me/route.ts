import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  // Get the token from cookies
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // In a real app, you would:
  // 1. Verify the JWT token
  // 2. Fetch the user from the database

  // For now, we'll return mock user data
  return NextResponse.json({
    id: "123",
    email: "user@example.com",
    username: "testuser",
    avatarUrl: null,
  })
}

