"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Activity, Dumbbell } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        redirect: false,
        login: formData.login,
        password: formData.password,
      })

      if (result?.error) {
        console.error("SignIn Error:", result.error)
        throw new Error(result.error || "Invalid credentials")
      } else if (result?.ok) {
        console.log("SignIn Successful:", result)
        router.push("/chat")
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
      } else {
        throw new Error("An unexpected error occurred during login.")
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/chat" })
    } catch (error) {
      console.error("Google SignIn Error:", error)
      toast({
        title: "Google Sign-In Failed",
        description: "Could not sign in with Google.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center justify-center">
            <Dumbbell className="h-8 w-8 mr-2 text-primary" />
            FitChatly AI
          </h1>
          <p className="text-muted-foreground mt-2">Your personal AI fitness coach</p>
        </div>

        <Card className="border-2 shadow-lg glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-extrabold text-center">Login</CardTitle>
            <CardDescription className="text-center">Use your email or username</CardDescription>
          </CardHeader>
          <form onSubmit={handleCredentialsSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Email or Username</Label>
                <Input
                  id="login"
                  name="login"
                  type="text"
                  placeholder="your.email@example.com or username"
                  value={formData.login}
                  onChange={handleChange}
                  className="h-11 glass border-white/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 glass border-white/20"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 rounded-xl gradient-primary shadow-md" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Sign In with Email/Username"}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl glass border-white/20 flex items-center justify-center gap-2 hover:bg-white/10"
                onClick={handleGoogleSignIn}
                type="button"
                disabled={isLoading}
              >
                <FcGoogle className="h-5 w-5" />
                Sign In with Google
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Create account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

