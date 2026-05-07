# =============================================================================
# LIMS Frontend - Dockerfile
# Base OS  : Debian (bookworm-slim)
# Node     : 24 (latest 24.x from Docker Hub)
# Framework: React + Vite SPA → served via `serve` (static file server)
# Port     : 4173
# =============================================================================

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install ALL dependencies (including devDeps: vite, typescript, etc.)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source and build for production
COPY . .
RUN npm run build

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
# Only serves static files — no vite, no node_modules, no devDeps needed
FROM node:24-bookworm-slim AS runner

WORKDIR /app

# Install `serve` globally — lightweight static file server for SPAs
RUN npm install -g serve

# Copy only the built output from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4173 || exit 1

# Serve SPA with client-side routing support (-s = single-page app mode)
CMD ["serve", "-s", "dist", "-l", "4173"]
