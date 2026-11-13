FROM node:24-bookworm-slim AS node-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM node-base AS backend-build\

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma

RUN npm ci

RUN npm run db:generate

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM node-base AS backend

ENV NODE_ENV=production

COPY --from=backend-build --chown=node:node /app/package*.json ./
COPY --from=backend-build --chown=node:node /app/node_modules ./node_modules
COPY --from=backend-build --chown=node:node /app/dist ./dist
COPY --from=backend-build --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3333

CMD ["node", "dist/server.js"]


FROM node-base AS frontend-build

COPY web/package.json web/package-lock.json ./

RUN npm ci

COPY web/ ./

RUN npm run build

FROM nginx:stable-alpine AS frontend

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
