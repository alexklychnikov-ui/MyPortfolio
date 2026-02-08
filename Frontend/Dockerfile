# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

# Install system dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy only package files for layer caching
COPY package.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm@latest

# Install dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application
RUN pnpm build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install pnpm
RUN npm install -g pnpm@latest

# Install only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy public files and build artifacts from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# EXPOSE
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# CMD
CMD ["node", "server.js"]
