# Use Node.js 24 on Debian slim for better compatibility
FROM node:24-bookworm-slim

# Set working directory
WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
