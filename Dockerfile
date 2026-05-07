# =============================================================================
# LIMS Frontend - Dockerfile
# Base OS  : Debian (bookworm-slim)
# Node     : 24 (latest 24.x from Docker Hub)
# Framework: React + Vite (served via vite preview)
# Port     : 4173
# =============================================================================

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first (layer cache optimization)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .

# Build for production (uses .env.production automatically)
RUN npm run build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner

WORKDIR /app

# Install only production-required packages
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile --omit=dev

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# vite preview reads vite.config.ts from project root
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./

# Expose vite preview port (defined in vite.config.ts → preview.port: 4173)
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4173 || exit 1

# Run vite preview (serves the production build)
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
