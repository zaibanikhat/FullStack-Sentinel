FROM node:22-alpine

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application files
COPY . .

# Create a .env file with default values if it doesn't exist
RUN if [ ! -f .env ]; then \
    echo "DATABASE_URL=postgres://user:password@db:5432/sentineldb" > .env && \
    echo "REDIS_URL=redis://:password@redis:6379/0" >> .env && \
    echo "REDIS_PASSWORD=password" >> .env; \
    fi

# Create the fixtures directory and copy the files
RUN mkdir -p /usr/src/app/fixtures && \
    cp /fixtures/kb_docs.json /usr/src/app/fixtures/ 2>/dev/null || true && \
    cp /fixtures/transactions.json /usr/src/app/fixtures/ 2>/dev/null || true

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Command to run the application
CMD ["npm", "run", "dev"]