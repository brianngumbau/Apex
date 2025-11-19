## Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (leverage cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

## Runtime stage
FROM nginx:1.27-alpine AS runtime

# Copy built assets to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: minimal default config is fine for static sites
# Expose default HTTP port
EXPOSE 80

# Healthcheck: ensure index is served
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://127.0.0.1/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

