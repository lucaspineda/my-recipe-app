# Use the Node.js LTS (18 or 20 recommended) as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code to the container
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port that Next.js runs on (default: 3000)
EXPOSE 3000

# Start the Next.js app in production mode
CMD ["npm", "run", "start"]
