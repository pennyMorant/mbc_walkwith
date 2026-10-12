# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.13

FROM oven/bun:${BUN_VERSION}-debian AS dependencies
WORKDIR /workspace

COPY package.json bun.lock ./
COPY backend/package.json backend/package.json
COPY apps/admin_web/package.json apps/admin_web/package.json
COPY apps/public_web/package.json apps/public_web/package.json
COPY packages/api_contracts/package.json packages/api_contracts/package.json
COPY packages/shared_types/package.json packages/shared_types/package.json
COPY packages/ui_tokens/package.json packages/ui_tokens/package.json

RUN bun install --frozen-lockfile

FROM dependencies AS api_builder
COPY backend backend
COPY packages/api_contracts packages/api_contracts
COPY packages/shared_types packages/shared_types

RUN bun build backend/src/main.ts \
  --target=bun \
  --outdir=/workspace/backend_dist \
  --entry-naming='[dir]/[name].js'

FROM oven/bun:${BUN_VERSION}-debian AS api
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3020

COPY --from=api_builder --chown=bun:bun /workspace/backend_dist/main.js ./main.js

USER bun
EXPOSE 3020
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3020/v1/health');if(!r.ok)process.exit(1)"]

CMD ["bun", "./main.js"]

FROM dependencies AS migration
WORKDIR /workspace/backend

COPY backend /workspace/backend
COPY packages/api_contracts /workspace/packages/api_contracts
COPY packages/shared_types /workspace/packages/shared_types

ENV NODE_ENV=production
CMD ["bun", "run", "db:migrate"]
