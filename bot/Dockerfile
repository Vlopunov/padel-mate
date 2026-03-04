FROM node:20-alpine

WORKDIR /app

COPY bot/package*.json ./
RUN npm ci --omit=dev

COPY bot/ .

RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "index.js"]
