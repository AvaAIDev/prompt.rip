FROM node:18-alpine

WORKDIR /usr/src/app/backend/

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose API port
EXPOSE 8001

# Start production server
CMD ["npm", "start"]