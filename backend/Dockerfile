# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
# Copy frontend dependency files
COPY frontend/package*.json ./
RUN npm install
# Copy frontend source and build
COPY frontend/ ./
ARG VITE_API_URL=/api/v1
RUN VITE_API_URL=$VITE_API_URL npm run build

# Stage 2: Build Backend & Final Image
FROM node:20-slim
ENV NODE_ENV=production
# Add necessary system dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup user and group
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh appuser

# Copy backend dependency files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Copy frontend build from Stage 1 to the backend's public directory
COPY --from=frontend-builder /frontend/dist ./public

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 5000
CMD ["node", "index.js"]
