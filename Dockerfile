# ---- Stage 1: Build client ----
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy root + workspace manifests
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all workspace deps (needed for client build)
RUN npm ci

# Copy client source and build
COPY client ./client
RUN npm run build --prefix client


# ---- Stage 2: Production server ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install only server prod deps
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev --workspace=server --include-workspace-root=false \
    || (cd server && npm ci --omit=dev)

# Copy server source
COPY server ./server

# Copy built client assets from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Ensure uploads dir exists
RUN mkdir -p /app/server/uploads

EXPOSE 5000

CMD ["node", "server/index.js"]
