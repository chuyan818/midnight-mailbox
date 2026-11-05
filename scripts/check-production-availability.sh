#!/usr/bin/env bash
set -Eeuo pipefail

# One-shot production availability check by default.
# Use --watch to keep polling until the service becomes healthy.
# Override URLs with a comma-separated PRODUCTION_URLS value when Railway
# assigns a new default domain, for example:
#   PRODUCTION_URLS="https://www.shenye.xin,https://new.up.railway.app" \
#     ./scripts/check-production-availability.sh --watch

HEALTH_PATH="${HEALTH_PATH:-/api/health}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"
RETRY_COUNT="${RETRY_COUNT:-3}"
RETRY_DELAY_SECONDS="${RETRY_DELAY_SECONDS:-5}"
WATCH_INTERVAL_SECONDS="${WATCH_INTERVAL_SECONDS:-30}"
PRODUCTION_URLS="${PRODUCTION_URLS:-https://www.shenye.xin,https://midnight-mailbox-production.up.railway.app}"
WATCH=false

usage() {
  cat <<'EOF'
Usage: scripts/check-production-availability.sh [--watch]

Checks each configured production origin twice:
  1. GET /api/health must return HTTP 200 and JSON status "ok".
  2. GET / must return HTTP 200.

Environment variables:
  PRODUCTION_URLS          Comma-separated origins to check.
  HEALTH_PATH              Health path (default: /api/health).
  TIMEOUT_SECONDS          Curl timeout per request (default: 10).
  RETRY_COUNT              Attempts per origin (default: 3).
  RETRY_DELAY_SECONDS      Delay between attempts (default: 5).
  WATCH_INTERVAL_SECONDS   Delay between watch rounds (default: 30).
EOF
}

while (($# > 0)); do
  case "$1" in
    --watch) WATCH=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

trim_slashes() {
  local value="$1"
  value="${value%/}"
  printf '%s' "$value"
}

check_http() {
  local url="$1"
  local expected_kind="$2"
  local response_file status body
  response_file="$(mktemp)"

  status="$(curl -sS -L --connect-timeout "$TIMEOUT_SECONDS" --max-time "$TIMEOUT_SECONDS" \
    -o "$response_file" -w '%{http_code}' "$url" 2>/dev/null || true)"
  body="$(cat "$response_file" 2>/dev/null || true)"

  if [[ "$expected_kind" == "health" ]]; then
    if [[ "$status" != "200" ]]; then
      echo "FAIL health $url -> HTTP ${status:-no-response}" >&2
      rm -f "$response_file"
      return 1
    fi
    if ! BODY="$body" python3 - <<'PY'
import json
import os
import sys
try:
    payload = json.loads(os.environ.get("BODY", ""))
except json.JSONDecodeError:
    sys.exit(1)
sys.exit(0 if payload.get("status") == "ok" else 1)
PY
    then
      echo "FAIL health $url -> HTTP 200 but body is not {\"status\":\"ok\"}" >&2
      rm -f "$response_file"
      return 1
    fi
    echo "OK   health $url -> HTTP 200 status=ok"
  else
    if [[ "$status" != "200" ]]; then
      echo "FAIL home   $url -> HTTP ${status:-no-response}" >&2
      rm -f "$response_file"
      return 1
    fi
    echo "OK   home   $url -> HTTP 200"
  fi
  rm -f "$response_file"
}

check_origin() {
  local origin="$1"
  origin="$(trim_slashes "$origin")"
  [[ -n "$origin" ]] || return 0

  local attempt
  for ((attempt = 1; attempt <= RETRY_COUNT; attempt++)); do
    if check_http "${origin}${HEALTH_PATH}" health && check_http "${origin}/" home; then
      return 0
    fi
    if ((attempt < RETRY_COUNT)); then
      echo "Retrying $origin (${attempt}/${RETRY_COUNT}) in ${RETRY_DELAY_SECONDS}s..." >&2
      sleep "$RETRY_DELAY_SECONDS"
    fi
  done
  return 1
}

run_once() {
  local failed=0 origin
  IFS=',' read -ra origins <<< "$PRODUCTION_URLS"
  echo "Checking production availability: ${PRODUCTION_URLS}"
  for origin in "${origins[@]}"; do
    if ! check_origin "$origin"; then
      failed=1
    fi
  done
  return "$failed"
}

if [[ "$WATCH" == true ]]; then
  while true; do
    if run_once; then
      echo "Production availability check passed."
      exit 0
    fi
    echo "No healthy production origin yet; checking again in ${WATCH_INTERVAL_SECONDS}s..." >&2
    sleep "$WATCH_INTERVAL_SECONDS"
  done
else
  run_once
fi
