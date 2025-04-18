import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"; // Import Google Provider
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Use bcryptjs
import type { Adapter, AdapterUser } from "next-auth/adapters"; // Import Adapter type
import type { DefaultSession, User as DefaultUser, Session } from "next-auth";
import type { JWT } from "@auth/core/jwt";

// Ensure Prisma Client is initialized only once
const prisma = new PrismaClient();

// --- Type Extensions (Important for type safety) ---

// Extend the default User type
interface User extends DefaultUser {
  username?: string | null;
  role?: string; // Add role if using it like in the example
}

// Extend the default Session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: User & {
      id: string;
      role?: string; // Add role
    };
  }
}

// Extend the JWT type
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    role?: string; // Add role
  }
}

// --- Auth.js Configuration Options --- 
// Define and export the options object separately, let TS infer
export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter, 
  providers: [
    // Google Provider Configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optional: Customize profile data mapping if needed
      // profile(profile) {
      //   console.log("[Google Profile]:", profile);
      //   return {
      //     id: profile.sub,
      //     name: profile.name,
      //     email: profile.email,
      //     image: profile.picture,
      //     // Assign a default role or derive it
      //     role: profile.role ?? "user", 
      //     username: profile.username ?? profile.email // Example: use email as fallback username
      //   };
      // }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.login || !credentials.password) {
          console.error("[Auth] Error: Missing credentials");
          return null;
        }

        const loginIdentifier = credentials.login as string;
        const password = credentials.password as string;

        let dbUser = await prisma.user.findUnique({
          where: { email: loginIdentifier },
        });
        if (!dbUser) {
          dbUser = await prisma.user.findUnique({
            where: { username: loginIdentifier },
          });
        }

        if (!dbUser || !dbUser.password) {
          console.error(`[Auth] Error: User not found or no password for ${loginIdentifier}`);
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, dbUser.password);
        if (!isValidPassword) {
          console.error(`[Auth] Error: Invalid password for ${loginIdentifier}`);
          return null;
        }

        console.log(`[Auth] Success: User ${loginIdentifier} authenticated.`);
        // Return the user object matching our extended User type
        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image,
          username: dbUser.username,
          role: dbUser.role, // Add role here if it exists
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    // signIn callback to handle user creation/linking for OAuth
    async signIn({ user, account, profile }: { user: User | AdapterUser, account: any, profile?: any }) {
        if (account?.provider === "google") {
            try {
                // Check if user exists based on email from Google profile
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                    include: { accounts: true } 
                });

                if (existingUser) {
                    // User exists, check if the Google account is already linked
                    const googleAccountLinked = existingUser.accounts.some(
                        acc => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
                    );

                    if (!googleAccountLinked) {
                        // Link Google account to existing user
                        console.log(`[Auth SignIn] Linking Google account to existing user: ${user.email}`);
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type, // e.g., 'oauth'
                                provider: account.provider, // 'google'
                                providerAccountId: account.providerAccountId, // Google's unique ID for the user
                                access_token: account.access_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                session_state: account.session_state,
                            }
                        });
                    }
                    // Allow sign in for existing user with linked/now-linked account
                    return true;
                } else {
                    // User does not exist, create new user and link Google account
                    console.log(`[Auth SignIn] Creating new user and linking Google account: ${user.email}`);
                    await prisma.user.create({
                        data: {
                            id: user.id, // Use the ID provided by NextAuth/Adapter
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            // Assign default values if needed
                            username: user.email, // Example: use email as username initially
                            role: "user", // Assign a default role
                            emailVerified: new Date(), // Mark email as verified since it's from Google
                            accounts: {
                                create: {
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    session_state: account.session_state,
                                }
                            }
                        }
                    });
                    return true; // Allow sign in for new user
                }
            } catch (error) {
                console.error("[Auth SignIn] Error during Google sign-in DB operations:", error);
                return false; // Prevent sign in on error
            }
        }
        // Allow sign in for other providers (like credentials) by default
        return true;
    },
    async jwt({ token, user, account }: { token: JWT; user?: User | AdapterUser, account?: any }): Promise<JWT> {
       console.log("[Auth JWT Callback] Fired. Account:", account?.provider);
       // Persist id, role, and username to the token
       if (user) {
         console.log("[Auth JWT Callback] User object present, adding to token:", user);
         token.id = user.id;
         const extendedUser = user as User;
         token.username = extendedUser.username; 
         token.role = extendedUser.role; // Add role
       } else {
         console.log("[Auth JWT Callback] User object NOT present.");
       }
       // If google sign in, ensure role is populated from DB if needed on first jwt creation
       if (account?.provider === "google" && !token.role) {
           console.log("[Auth JWT Callback] Google sign in, fetching user role from DB for email:", token.email);
           const dbUser = await prisma.user.findUnique({ where: { email: token.email! } });
           if (dbUser) {
             console.log("[Auth JWT Callback] Found user in DB, adding role:", dbUser.role);
             token.role = dbUser.role;
           } else {
             console.log("[Auth JWT Callback] User not found in DB for Google sign in.");
           }
       }
       console.log("[Auth JWT Callback] Returning token:", token);
       return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      console.log("[Auth Session Callback] Fired. Token received:", token);
      if (token?.id && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role; // Add role
        console.log("[Auth Session Callback] Populated session.user:", session.user);
      } else {
        console.log("[Auth Session Callback] Token/session.user missing, session:", session);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on auth errors
  },
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === "development",
  // Add trusted hosts configuration
  trustHosts: true, // Trust all hosts matching NEXTAUTH_URL
  // Alternatively, you can explicitly list trusted domains
  cookies: {
    sessionToken: {
      // Use a secure name in production, standard name in development
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token` // Using common secure prefix for HTTPS
        : `next-auth.session-token`,         // Standard name for HTTP/localhost
      options: {
        httpOnly: true, // Important for security
        sameSite: 'lax' as const, // Good default - Use 'as const' to fix type error
        path: "/",
        // Set domain only for production to avoid localhost issues
        domain: process.env.NODE_ENV === "production" ? ".fitchatly.com" : undefined,
        // Ensure secure flag matches environment (HTTPS required)
        secure: process.env.NODE_ENV === "production", 
      },
    },
    // Add configurations for other cookies if needed (e.g., callbackUrl, csrfToken)
  }
};

// Initialize NextAuth with the options and export necessary parts
const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Export handlers separately for the API route
export const { GET, POST } = handlers;

// Export auth separately for potential use in middleware or server components
// This is the part that might be causing edge issues if it bundles Prisma indirectly.
export { auth, signIn, signOut }; 