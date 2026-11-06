FROM node:20-alpine

# Prisma necesita OpenSSL en Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm install prisma --no-save

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
