import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const saltRounds = 10 // Standard practice for bcrypt salt rounds

export async function POST(req: Request) {
  try {
    const { email, username, password, name } = await req.json()

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json({ message: "Email, username, and password are required" }, { status: 400 })
    }

    // Check if user already exists (by email or username)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Email or username already exists" },
        { status: 409 } // 409 Conflict
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Store the user in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || username, // Use username as name if name is not provided
      },
    })

    console.log(`User registered successfully: ${newUser.username} (${newUser.email})`)

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      { message: "User registered successfully", user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}

