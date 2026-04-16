# syntax=docker/dockerfile:1.7

# ============================================
# Stage 0: Base
# ============================================
FROM node:22-alpine AS base

WORKDIR /app

# Install system dependencies and pnpm once for all stages
RUN apk add --no-cache libc6-compat \
    && npm install -g pnpm@latest

# ============================================
# Stage 1: Builder
# ============================================
FROM base AS builder

# Copy package files first to maximize dependency cache reuse
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN --mount=type=cache,id=portfolio-frontend-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy application sources after dependencies
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application
RUN pnpm build

# ============================================
# Stage 2: Runner (Production)
# ============================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

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
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

# CMD
CMD ["node", "server.js"]
