FROM node:24-alpine AS base
RUN apk add --no-cache wget
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared packages/shared
COPY packages/domain packages/domain
COPY packages/application packages/application
COPY apps/api apps/api
RUN pnpm install --filter @crece/api...
RUN pnpm --filter @crece/shared build \
  && pnpm --filter @crece/domain build \
  && pnpm --filter @crece/application build \
  && pnpm --filter @crece/api build
RUN pnpm --filter @crece/api deploy --prod /deploy

FROM node:24-alpine AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3001
COPY --from=build /deploy ./
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
