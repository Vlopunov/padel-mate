FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
