FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ .

RUN npx prisma generate && chmod +x start.sh

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["sh", "start.sh"]
