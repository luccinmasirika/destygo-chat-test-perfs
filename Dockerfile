# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm config set registry https://registry.npmjs.org/ && \
    npm ci --only=production --no-audit --no-fund --prefer-offline && \
    npm cache clean --force

COPY . .

# Final stage (runtime)
FROM node:18-alpine

WORKDIR /app

# Install system dependencies required for puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    wget

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=3000 \
    DESTYGO_NAVIGATION_TIMEOUT=60000 \
    DESTYGO_CHAT_TIMEOUT=30000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["node", "server.js"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/test-status || exit 1