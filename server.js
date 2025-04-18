// Log environment variables for debugging
console.log("---- Environment Variables Debug ----");
console.log("Node sees DATABASE_URL:", process.env.DATABASE_URL);
console.log("Node sees NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET);
console.log("Node sees GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Node sees GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("Node sees NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("Node sees OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
console.log("-----------------------------------");

// Import the Next.js server generated during build
const server = require('./.next/standalone/server'); 