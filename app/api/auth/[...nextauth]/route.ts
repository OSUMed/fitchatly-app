// Re-export the handlers from the central auth config file
export { GET, POST } from "@/auth";

// Optional: If you explicitly want to run Auth.js API routes in Node.js runtime 
// (might be necessary if using database sessions or complex providers not fully Edge-ready)
// export const runtime = "nodejs"; 

// If you need edge-compatible versions (though likely not needed with JWT strategy)
// export const runtime = "edge"; 