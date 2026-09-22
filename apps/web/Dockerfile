FROM node:24-alpine AS base
RUN apk add --no-cache wget
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm install --filter @crece/web...
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @crece/shared build && pnpm --filter @crece/web build

FROM node:24-alpine AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
