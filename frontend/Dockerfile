# Frontend Dockerfile for React (Vite)
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code, public folder and Vite entry/config
COPY index.html vite.config.mjs ./
COPY src ./src
COPY public ./public

# Build the application
RUN npm run build

# Production stage - use simpler approach
FROM node:22-alpine

# Install serve
RUN npm install -g serve

WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/build ./build

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "8080"]
