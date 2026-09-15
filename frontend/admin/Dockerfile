# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /build

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# VITE_MOCK is baked in at build time — must be "false" for any real deployment.
ARG VITE_MOCK=false
ENV VITE_MOCK=${VITE_MOCK}
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1
