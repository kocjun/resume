# Multi-stage build for Resume Frontend (Vue.js)
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# Verify build output
RUN ls -la dist/ && \
    test -f dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# Stage 2: Export artifacts (for docker cp)
FROM scratch AS artifacts
COPY --from=builder /app/dist /dist
