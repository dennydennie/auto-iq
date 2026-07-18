FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /workspace

FROM base AS build

ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG STORAGE_ENDPOINT
ARG STORAGE_FORCE_PATH_STYLE
ARG SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_ENVIRONMENT
ARG SENTRY_RELEASE

ENV NODE_ENV=$NODE_ENV \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    STORAGE_ENDPOINT=$STORAGE_ENDPOINT \
    STORAGE_FORCE_PATH_STYLE=$STORAGE_FORCE_PATH_STYLE \
    SENTRY_DSN=$SENTRY_DSN \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT \
    SENTRY_RELEASE=$SENTRY_RELEASE

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/contracts packages/contracts

RUN pnpm --filter @autoiq/web build

FROM node:22-alpine AS runtime

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
