FROM node:18-alpine

WORKDIR /app

# Install dependencies for node modules
RUN apk add --no-cache python3 make g++ tar

# Create necessary directories
RUN mkdir -p /app/data/servers /app/data/backups /app/logs

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set permissions for scripts
RUN chmod +x /app/index.js

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"] 