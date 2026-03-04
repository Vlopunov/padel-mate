FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install

COPY server/ .

RUN npx prisma generate && chmod +x start.sh

EXPOSE 3000

CMD ["sh", "start.sh"]
