FROM node:18-alpine

WORKDIR /app
COPY . .

# Install and build client
WORKDIR /app/client
RUN npm install
RUN npm run build

# Install server deps + generate Prisma client
WORKDIR /app/server
RUN npm install
RUN DATABASE_URL="postgresql://x:x@x:5432/x" npx prisma generate

# Install bot deps
WORKDIR /app/bot
RUN npm install

# Start server (prisma push + node)
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node index.js"]
