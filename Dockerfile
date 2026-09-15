# OpenClaw Personal Agent Console - Portable Container Image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Persist data directory
VOLUME ["/app/data"]
ENV DATA_FILE_PATH=/app/data/openclaw_store.json

EXPOSE 3000

CMD ["npm", "start"]
