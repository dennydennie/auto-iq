# Project: auto-iq
# Module: apps/api deployment
# Author: backend_developer agent
# Date: 2026-06-09
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/contracts packages/contracts

RUN pnpm --filter api build
RUN pnpm --filter api --prod deploy --legacy /app

FROM node:22-alpine AS runtime

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=build /app ./
COPY --from=build /workspace/apps/api/scripts ./scripts
COPY --from=build /workspace/apps/api/scripts ./apps/api/scripts

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
