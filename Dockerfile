FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# 1) Install dependencies (with cache) — separate stage for better caching
FROM node:18-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
# If you use .npmrc or private registry, uncomment next line
# COPY .npmrc ./.npmrc
RUN npm ci

# 2) Build the app — needs devDependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Provide build-time env for public config if needed
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}
RUN npm run build

# 3) Production runner using Next standalone output
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
	&& adduser -S nextjs -u 1001 -G nodejs

# Copy only the necessary build output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# --- NEW: ensure .next cache exists and is writable by nextjs user ---
RUN mkdir -p /app/.next/cache \
 && chown -R 1001:1001 /app/.next
# ---------------------------------------------------------------------

USER 1001

ENV PORT=3000
EXPOSE 3000

# server.js is created by Next.js standalone output
CMD ["node", "server.js"]
