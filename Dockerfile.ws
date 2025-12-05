# WebSocket server image (tRPC subscriptions)
FROM node:20-alpine

WORKDIR /app

# Install dependencies (include dev for tsx)
COPY package*.json ./
RUN npm ci --include=dev

# Copy source
COPY . .

# Default port (override via WS_PORT)
ENV WS_PORT=3001

EXPOSE 3001

# Run the standalone ws server
CMD ["npm", "run", "dev:ws"]