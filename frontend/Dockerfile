FROM node:18-alpine

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app/frontend/

# Install pnpm globally
# RUN npm install -g pnpm

# Copy package.json and install dependencies first (for better caching)
COPY package*.json ./
# RUN npm install
RUN npm install

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# Expose the port for the app
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "preview"]
