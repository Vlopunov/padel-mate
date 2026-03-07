FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Install server deps + generate Prisma client
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
RUN DATABASE_URL="postgresql://x:x@x:5432/x" npx prisma generate && chmod +x start.sh

# Install bot deps
WORKDIR /app/bot
COPY bot/package*.json ./
RUN npm ci --omit=dev
COPY bot/ .

# Non-root user
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

WORKDIR /app/server

EXPOSE 3000

CMD ["sh", "start.sh"]
