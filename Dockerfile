FROM node:20-bookworm-slim

WORKDIR /app

# Install system deps for TLS
RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# NOTE: Avoid setting build-time placeholder env vars here.
# Next.js may bake NEXT_PUBLIC_* values into the client bundle during build.
# Configure runtime env vars in Render/Vercel instead.

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
