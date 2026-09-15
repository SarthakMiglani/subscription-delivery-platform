# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cache dependencies separately from source for faster rebuilds.
# A BuildKit cache mount persists ~/.m2 across builds (and can reuse a
# pre-warmed cache), so this survives even if a single fetch is flaky —
# retried fetches resume against previously-downloaded jars.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -Dmaven.wagon.http.retryHandler.count=5 dependency:go-offline

COPY src ./src
# Tests require Testcontainers/Docker-in-Docker, which isn't available during a
# normal image build — the test suite is run separately in CI, not here.
# Not forced offline here: go-offline only resolves the main dependency graph,
# not every transitive artifact touched by plugin goals (e.g. the repackage
# goal below pulls in a few extra jars go-offline doesn't fetch). The cache
# mount means anything already downloaded is reused, not re-fetched.
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B clean package -DskipTests

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Run as a non-root user
RUN addgroup -S juice && adduser -S juice -G juice
WORKDIR /app

COPY --from=build /build/target/*.jar app.jar
RUN chown juice:juice app.jar
USER juice

EXPOSE 8080

# Container-level healthcheck hits the public, unauthenticated health endpoint.
# Respects $PORT so this still works on platforms (e.g. Render) that inject
# their own port via environment variable instead of the 8080 default.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q --spider "http://localhost:${PORT:-8080}/api/v1/health" || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
