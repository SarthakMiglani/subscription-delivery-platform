#!/usr/bin/env bash
#
# Daily PostgreSQL backup for the juice-platform production database.
#
# Runs pg_dump inside the running "juice-db" container and writes a compressed,
# timestamped dump to this directory (mounted into the db container at /backup,
# see docker-compose.prod.yml). Keeps the last 14 daily backups and prunes older
# ones automatically.
#
# Usage (from the workspace root, where docker-compose.prod.yml and .env live):
#   ./backend/backup/backup.sh
#
# Recommended: schedule via host crontab, e.g. daily at 03:00 IST:
#   0 3 * * * cd /opt/juice-platform && ./backend/backup/backup.sh >> /var/log/juice-backup.log 2>&1
#
# Restore (destructive — overwrites the target database):
#   gunzip -c backend/backup/juice_platform_2025-01-15_0300.sql.gz | \
#     docker exec -i juice-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$WORKSPACE_ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

: "${POSTGRES_DB:?POSTGRES_DB must be set (via .env or environment)}"
: "${POSTGRES_USER:?POSTGRES_USER must be set (via .env or environment)}"

TIMESTAMP="$(date +%Y-%m-%d_%H%M)"
OUT_FILE="$SCRIPT_DIR/juice_platform_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

echo "[backup] Dumping $POSTGRES_DB from container juice-db -> $OUT_FILE"
docker exec juice-db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUT_FILE"

echo "[backup] Pruning backups older than $RETENTION_DAYS days"
find "$SCRIPT_DIR" -name 'juice_platform_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] Done: $(du -h "$OUT_FILE" | cut -f1) written"
