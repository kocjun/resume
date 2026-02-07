# Multi-stage build for Resume Backend API
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Start application
CMD ["node", "src/server.js"]
