# Home Assistant-add-on: Hygge-bridge
FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src
COPY certs ./certs

# Webpagina via Home Assistant (ingress); stand en grafiek bewaren in /data (blijft bij updates)
ENV WEB_PORT=8099 \
    STATE_FILE=/data/state.json \
    NODE_ENV=production

CMD ["node", "src/index.js"]
