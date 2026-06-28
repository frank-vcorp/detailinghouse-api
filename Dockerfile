# DetailingHouse API — Node.js + PostgreSQL en Railway
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias primero (cache de capas Docker)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Puerto de Railway (variable de entorno)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

CMD ["node", "server.js"]
