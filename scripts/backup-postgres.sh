#!/usr/bin/env bash
# Create a consistent compressed PostgreSQL logical backup.
# Required: DATABASE_URL
# Optional: BACKUP_DIR, RETENTION_DAYS, S3_BUCKET, S3_PREFIX, AWS_REGION
set -Eeuo pipefail

log() { printf '[backup] %s\n' "$*"; }
fail() { printf '[backup] ERROR: %s\n' "$*" >&2; exit 1; }

command -v pg_dump >/dev/null 2>&1 || fail "pg_dump is required (install the PostgreSQL client tools)"
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is required"
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is not set"

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
S3_PREFIX="${S3_PREFIX:-midnight-mailbox/postgres}"

[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || fail "RETENTION_DAYS must be a non-negative integer"
mkdir -p "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="midnight-mailbox-${stamp}"
tmp_file="${BACKUP_DIR}/.${base}.dump.tmp"
backup_file="${BACKUP_DIR}/${base}.dump"
checksum_file="${backup_file}.sha256"
trap 'rm -f "$tmp_file"' EXIT

log "creating ${backup_file}"
# Custom format is compressed and suitable for pg_restore. sslmode is inherited
# from DATABASE_URL (Railway's generated URL is used unchanged).
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$tmp_file" \
  "$DATABASE_URL"

mv "$tmp_file" "$backup_file"
sha256sum "$backup_file" > "$checksum_file"

# A Railway container filesystem is ephemeral. Set S3_BUCKET in production so
# the dump is copied to durable object storage before local retention cleanup.
if [[ -n "${S3_BUCKET:-}" ]]; then
  command -v aws >/dev/null 2>&1 || fail "S3_BUCKET is set but aws CLI is not installed"
  : "${AWS_REGION:=auto}"
  endpoint_args=()
  [[ -n "${S3_ENDPOINT_URL:-}" ]] && endpoint_args+=(--endpoint-url "$S3_ENDPOINT_URL")
  aws s3 cp "$backup_file" "s3://${S3_BUCKET}/${S3_PREFIX}/${base}.dump" --region "$AWS_REGION" "${endpoint_args[@]}"
  aws s3 cp "$checksum_file" "s3://${S3_BUCKET}/${S3_PREFIX}/${base}.dump.sha256" --region "$AWS_REGION" "${endpoint_args[@]}"
  log "uploaded to s3://${S3_BUCKET}/${S3_PREFIX}/"
else
  log "S3_BUCKET is not set; local files are not durable on Railway"
fi

find "$BACKUP_DIR" -type f -name 'midnight-mailbox-*.dump' -mtime "+$RETENTION_DAYS" -print -delete
find "$BACKUP_DIR" -type f -name 'midnight-mailbox-*.dump.sha256' -mtime "+$RETENTION_DAYS" -print -delete

log "completed: ${backup_file}"
