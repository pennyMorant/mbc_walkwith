# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.13

FROM oven/bun:${BUN_VERSION}-debian AS builder
WORKDIR /workspace

COPY package.json bun.lock ./
COPY backend/package.json backend/package.json
COPY apps/admin_web/package.json apps/admin_web/package.json
COPY apps/public_web/package.json apps/public_web/package.json
COPY packages/api_contracts/package.json packages/api_contracts/package.json
COPY packages/shared_types/package.json packages/shared_types/package.json
COPY packages/ui_tokens/package.json packages/ui_tokens/package.json

RUN bun install --frozen-lockfile

COPY apps/admin_web apps/admin_web
COPY apps/public_web apps/public_web
COPY packages/api_contracts packages/api_contracts
COPY packages/shared_types packages/shared_types
COPY packages/ui_tokens packages/ui_tokens

ARG VITE_API_BASE_URL=/v1
ARG VITE_ADMIN_BASE_PATH=/admin/
RUN VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
    VITE_ADMIN_BASE_PATH="${VITE_ADMIN_BASE_PATH}" \
    bun run build:admin
RUN VITE_API_BASE_URL="${VITE_API_BASE_URL}" bun run build:public

FROM nginx:1.27-alpine AS web

RUN rm -f /etc/nginx/conf.d/default.conf
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /workspace/apps/public_web/dist /srv/public
COPY --from=builder --chown=nginx:nginx /workspace/apps/admin_web/dist /srv/admin

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]

CMD ["nginx", "-g", "daemon off;"]
