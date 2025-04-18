import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  // Get the pathname of the request
  const { pathname } = req.nextUrl

  // Check if the request is for an API route, static file, etc.
  // Avoid running auth logic on these internal paths.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") || // Exclude NextAuth API routes
    pathname.startsWith("/static/") ||
    pathname.includes(".") // Generally exclude paths with extensions (files)
  ) {
    return NextResponse.next()
  }

  // Log incoming cookies
  console.log("[Middleware] Request Path:", pathname);
  console.log("[Middleware] Incoming Cookies Header:", req.headers.get('cookie'));

  // Get the JWT token from the request
  const token = await getToken({ 
    req, 
    secret,
    // Use the appropriate cookie name based on the environment
    cookieName: process.env.NODE_ENV === "production" 
      ? '__Secure-next-auth.session-token'  // For production (HTTPS)
      : 'next-auth.session-token'           // For development (HTTP)
  })

  // Log the result of getToken
  console.log("[Middleware] getToken result:", token);

  // Check if the route is protected (add more routes if needed)
  const protectedRoutes = ["/chat", "/profile", "/api/chat", "/api/channels", "/api/favorites", "/api/profile"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If accessing a protected route without a valid token, redirect to login
  if (isProtectedRoute && !token) {
    // const url = req.nextUrl.clone() // DON'T clone the internal request URL
    // url.pathname = '/login'
    // url.searchParams.set("callbackUrl", pathname)

    // Construct the redirect URL using the public NEXTAUTH_URL
    const loginUrl = new URL("/login", process.env.NEXTAUTH_URL || req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname) // Keep the callback

    console.log(`[Middleware] No token, redirecting to: ${loginUrl.toString()}`)
    return NextResponse.redirect(loginUrl)
  }

  // If the token is valid or the route is not protected, allow the request
  // console.log("[Middleware] Valid token or public route, allowing request.")
  return NextResponse.next()
}

// Define which routes the middleware should run on
// This is slightly broader than before to ensure it runs, 
// but the logic inside filters out unnecessary paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to adjust this based on your specific needs.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

