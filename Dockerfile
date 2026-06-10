# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts skips native binary builds (sharp, unrs-resolver).
# We do a static export so next/image's sharp optimization isn't needed,
# and unrs-resolver is only used at lint time.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- builder ----
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- runner ----
FROM nginx:1.31-alpine AS runner

# Replace the default nginx config with our SPA-aware one
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the static export output
COPY --from=builder /app/out /usr/share/nginx/html

# Run nginx as a non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
 && touch /tmp/nginx.pid \
 && chown nginx:nginx /tmp/nginx.pid

USER nginx
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]
