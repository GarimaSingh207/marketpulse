# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for optimal layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies for TypeScript compilation
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY tsconfig.json ./
COPY src ./src
COPY seed-admin.ts ./

# Build TypeScript to dist/
RUN npm run build

# ─── Stage 2: Production Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies required for running DB push, seed, and server
RUN npm ci

# Copy generated Prisma client and built dist from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seed-admin.ts ./seed-admin.ts

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
