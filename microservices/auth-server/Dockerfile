FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY auth-server.js .

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "auth-server.js"]
