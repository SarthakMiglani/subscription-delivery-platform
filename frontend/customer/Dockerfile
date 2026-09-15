# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /build

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# Both are baked in at build time (Vite env vars are compile-time, not runtime).
ARG VITE_MOCK=false
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_MOCK=${VITE_MOCK}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1
