# Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5001

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

# Start server using node directly
CMD ["node", "server.js"]
