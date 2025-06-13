# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"] 