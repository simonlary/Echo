FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/out ./out
ADD https://coqui.gateway.scarf.sh/english/coqui/v1.0.0-huge-vocab/model.tflite ./model/model.tflite
ADD https://coqui.gateway.scarf.sh/english/coqui/v1.0.0-huge-vocab/huge-vocabulary.scorer ./model/huge-vocabulary.scorer
CMD [ "node", "out/index.js" ]
