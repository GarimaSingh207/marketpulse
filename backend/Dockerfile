# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma engine compatibility on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies
RUN npm ci

# Generate Prisma Client for linux-musl-openssl-3.0.x
RUN npx prisma generate

# Copy source code and build TypeScript to dist/
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─── Stage 2: Production Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma runtime on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client in production runner environment
RUN npx prisma generate

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
