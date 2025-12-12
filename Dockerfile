FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force
COPY --from=development /app/dist ./dist
COPY --from=development /app/keys ./keys

EXPOSE 3000

CMD ["node", "dist/src/main"]
