# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Install tsx for running TypeScript
RUN npm install -g tsx

# Start the production server
CMD ["tsx", "server/production.ts"]
