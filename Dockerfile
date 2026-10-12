FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY --from=build /app/dist ./dist
# Railway runs `pnpm db:migrate` as the pre-deploy command in /app.
# Keep the Drizzle config, schema, and generated PostgreSQL migrations in
# the runtime image so the migration command can resolve every referenced path.
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle-pg ./drizzle-pg

EXPOSE 3000
CMD ["node", "dist/server.js"]
