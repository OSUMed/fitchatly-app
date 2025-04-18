"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

interface UserProfile {
  id: string
  email: string
  username: string
  avatarUrl: string | null
}

// Mock data for development backdoor
const MOCK_PROFILE: UserProfile = {
  id: "mock-user-id",
  email: "dev@example.com",
  username: "DevUser",
  avatarUrl: null,
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      // Development backdoor check
      const isDevelopment = process.env.NODE_ENV === "development"
      const useBackdoor = true // Toggle this to true to use mock data

      try {
        // Use mock data for development
        if (isDevelopment && useBackdoor) {
          console.log("🔑 Using mock profile data")
          setProfile(MOCK_PROFILE)
          setUsername(MOCK_PROFILE.username)
          setIsLoading(false)
          return
        }

        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/login")
          return
        }

        const data = await response.json()
        setProfile(data)
        setUsername(data.username)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router, toast])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Create form data for multipart/form-data
      const formData = new FormData()
      formData.append("username", username)
      if (avatarFile) {
        formData.append("avatar", avatarFile)
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback>{profile?.username?.charAt(0) || "U"}</AvatarFallback>
                <AvatarImage
                  src={avatarPreview || profile?.avatarUrl || "/placeholder.svg?height=96&width=96"}
                  alt={profile?.username || "User"}
                />
              </Avatar>

              <div className="space-y-2 w-full">
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

