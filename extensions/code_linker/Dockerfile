FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY linker.js .
COPY update_on_save.py .
COPY config.json .

# Install Python for update_on_save script if needed
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Expose port (if linker uses one)
EXPOSE 3001

# Run the application
CMD ["node", "linker.js"]
