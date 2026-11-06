FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

# Aplica migraciones y arranca la API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
