FROM node:24.8.0-alpine
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production --silent

COPY . .

ENV NODE_ENV=production \
    ARI_URL="wss://asterisk.ridinn.com/ari/events" \
    ARI_USER="node" \
    ARI_PASSWORD="ari_password" \
    ARI_APP_NAME="node" \
    PORT=3000

EXPOSE ${PORT}

CMD ["node", "src/index.ts"]
