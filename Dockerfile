FROM node:8-alpine

WORKDIR /app

COPY . .

RUN apk add --update \
	&& apk add --no-cache --virtual .build-deps git curl python g++ make \
	&& npm install \
	&& npm run build \
	&& npm prune --production \
	&& apk del .build-deps

VOLUME /app/bot.config

CMD ["node", "/app/out/index.js"]
