FROM node:22-alpine AS base
RUN apk add --no-cache wget
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm install --filter @crece/api...
RUN pnpm --filter @crece/shared build && pnpm --filter @crece/api build

FROM node:22-alpine AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
