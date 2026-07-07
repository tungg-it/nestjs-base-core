FROM node:24-alpine AS base

WORKDIR /app

ENV CI=true

RUN corepack enable

# Cache dependency install separately from source changes
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm exec nest build api \
    && pnpm prune --prod --ignore-scripts

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV CI=true

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001 -G nodejs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/libs/core/src/i18n ./libs/core/src/i18n

USER nestjs

EXPOSE 8080

CMD ["node", "dist/apps/api/apps/api/src/main.js"]
