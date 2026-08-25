# Stage 1: Build the Astro SSR application
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build server and client output
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy the built Astro server and client output
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Create directories for uploads and data
RUN mkdir -p /app/uploads /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "server/index.js"]
