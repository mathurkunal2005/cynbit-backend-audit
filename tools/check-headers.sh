#!/usr/bin/env bash
# Passive check: reads the response headers of ONE page and reports which
# common security/performance headers are present. One HEAD request, nothing else.
#
# Usage:  bash tools/check-headers.sh https://www.cynbit.in/
#         bash tools/check-headers.sh --file tools/sample-headers.txt   (offline)
set -euo pipefail

if [ "${1:-}" = "--file" ]; then
  RAW="$(tr -d '\r' < "${2:?path to a saved header dump}")"
else
  URL="${1:-https://www.cynbit.in/}"
  RAW="$(curl -sS -I --max-time 15 "$URL" | tr -d '\r')"
fi

HEADERS="$(printf '%s\n' "$RAW" | tr '[:upper:]' '[:lower:]')"

check() {  # name, regex
  if printf '%s\n' "$HEADERS" | grep -Eq "^($2):"; then
    printf '  PRESENT  %s\n' "$1"
  else
    printf '  MISSING  %s\n' "$1"
  fi
}

echo "Security headers"
check "Content-Security-Policy (enforcing)"  "content-security-policy"
check "X-Frame-Options"                      "x-frame-options"
check "X-Content-Type-Options"               "x-content-type-options"
check "Referrer-Policy"                      "referrer-policy"
check "Permissions-Policy"                   "permissions-policy"
check "Strict-Transport-Security"            "strict-transport-security"
echo "Performance headers"
check "Content-Encoding (br/gzip)"           "content-encoding"
check "Cache-Control"                        "cache-control"
check "ETag"                                 "etag"
