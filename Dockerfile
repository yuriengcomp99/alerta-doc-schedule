FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
