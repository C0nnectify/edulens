FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build-time environment variables (placeholders for Next.js build)
# These are overridden at runtime by docker-compose environment
ENV MONGODB_URI=mongodb://mongodb:27017/edulens
ENV MONGODB_DB_NAME=edulens
ENV BETTER_AUTH_SECRET=build_placeholder
ENV BETTER_AUTH_URL=http://localhost:3000
ENV JWT_SECRET=build_placeholder
ENV NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
