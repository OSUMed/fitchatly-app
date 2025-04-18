'use client'

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // The SessionProvider component makes the session available via the useSession hook
  return <SessionProvider>{children}</SessionProvider>
} 