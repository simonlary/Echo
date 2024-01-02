FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# We need to install `alpine-sdk` and `python3` to build `@discordjs/opus`
RUN apk add --no-cache --virtual .build-deps alpine-sdk python3 \
    && npm ci --production \
    && apk del .build-deps
COPY --from=builder /app/out ./out
CMD [ "node", "out/index.js" ]
