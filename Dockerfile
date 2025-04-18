# Use an official Node.js runtime as a parent image
# Use Node.js 20 LTS (Iron)
FROM node:20 AS base

# Set timezone (Optional, but good practice for Debian)
# RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*
# ENV TZ=America/Los_Angeles # Replace with your desired timezone

# Set environment variables
# Prevents prompts during apt-get install
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages including openssl for Prisma and python/make for potential native deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# --- Dependencies Stage ---
FROM base AS deps
WORKDIR /app
# Copy dependency definitions
COPY package.json package-lock.json* ./
# Install dependencies
# Use --legacy-peer-deps if needed by your project
RUN npm ci --legacy-peer-deps

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# HOSTNAME, HOST, DEBUG might not be strictly needed by 'next start' but don't hurt
ENV HOSTNAME="0.0.0.0"
ENV HOST="0.0.0.0"
ENV DEBUG="next:*"

# --- IMPORTANT CHANGES HERE ---
# Copy the full build output, node_modules, and package definitions
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy public directory if needed (usually handled by .next/static copy, but safer to include)
COPY --from=builder /app/public ./public
# Copy prisma directory and schema if needed by runtime
COPY --from=builder /app/prisma ./prisma

# --- End Important Changes ---

# ADD Entrypoint Script (Keep this for migrations)
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port
EXPOSE 3000

# USE Entrypoint Script (Keep this)
ENTRYPOINT ["docker-entrypoint.sh"]

# --- CMD Change ---
# CMD becomes the command *run by* the entrypoint
# Use npx to ensure next is found, specify host and port
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
# --- End CMD Change ---