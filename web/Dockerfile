# STAGE 1: Build the React application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application for production
RUN npm run build

# STAGE 2: Serve the application with Nginx
# Use a lightweight, official Nginx image
FROM nginx:1.25-alpine

# Copy the static build files from the 'builder' stage to Nginx's web root directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration file
# This file is crucial for SPA routing to work correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow traffic to the web server
EXPOSE 80

# The default Nginx command will start the server automatically
CMD ["nginx", "-g", "daemon off;"]