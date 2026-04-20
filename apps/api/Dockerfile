# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Install Prisma client
RUN npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY src ./src
COPY prisma ./prisma/

# Build is not needed for Node.js but we ensure dependencies are ready
RUN npm run build || true

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R appuser:nodejs /app

# Copy from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Copy from builder stage
COPY --from=builder /app/src ./src

# Copy package files for runtime scripts
COPY --from=deps /app/package.json ./
COPY --from=deps /app/prisma ./prisma

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start command
CMD ["node", "src/index.js"]