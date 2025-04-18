import type { Metadata } from 'next'
import './globals.css'
// Remove AuthProvider import if Providers component handles SessionProvider
// import AuthProvider from '@/components/auth-provider'
// Import the new Providers component
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: 'FitChatly App',
  description: 'Chat with an AI assistant',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning for ThemeProvider */}
      <body>
        {/* Wrap children with the Providers component */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
