# Dockerfile for the FLAME API (used by Koyeb / Fly / any container host).
FROM node:20-slim

# OpenSSL is needed by Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps (postinstall runs `prisma generate`)
COPY package*.json ./
RUN npm install

# Copy the rest of the server
COPY . .

ENV NODE_ENV=production

# Generate client + push schema + seed, then start.
# db push/seed are safe to re-run; they keep the Neon DB in sync.
CMD npx prisma generate && npx prisma db push --accept-data-loss && node prisma/seed.js && node src/index.js
