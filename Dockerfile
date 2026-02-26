FROM node:18-alpine

WORKDIR /app
COPY . .

# Install and build client
WORKDIR /app/client
RUN npm install
RUN npm run build

# Install server deps + generate Prisma
WORKDIR /app/server
RUN npm install
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate
ENV DATABASE_URL=

# Install bot deps
WORKDIR /app/bot
RUN npm install

# Runtime
WORKDIR /app/server
EXPOSE ${PORT:-3000}
CMD npx prisma db push --accept-data-loss && node index.js
