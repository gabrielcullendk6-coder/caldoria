FROM node:20-alpine
WORKDIR /app
COPY server/ .
ENV NODE_ENV=production
CMD ["node", "server.js"]
