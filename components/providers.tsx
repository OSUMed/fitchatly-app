"use client"; // This component needs to be a client component

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react"; // Keep SessionProvider if used elsewhere
import { ThemeProvider } from "@/components/theme-provider"; // Keep ThemeProvider
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 