# Use Node.js LTS version
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy project files
COPY package*.json yarn.lock ./
RUN yarn install

# Copy all files
COPY . .

# Build the project
RUN yarn build

# Run the application
CMD ["node", "dist/main.js"]

# Expose the application port
EXPOSE 3000

