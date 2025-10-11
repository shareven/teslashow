#!/usr/bin/env bash
set -euo pipefail

# This script finds all unclosed drives in TeslaMate DB and closes them
# by calling TeslaMate's RPC through the teslamate container.

# Configurable via environment variables
DC_CMD=${DC_CMD:-"docker compose"}
TESLAMATE_SERVICE=${TESLAMATE_SERVICE:-"teslamate"}
DB_SERVICE=${DB_SERVICE:-"database"}
DB_USER=${DB_USER:-"teslamate"}
DB_NAME=${DB_NAME:-"teslamate"}

usage() {
  cat <<EOF
Usage:
  $(basename "$0")                # Close all unclosed drives
  $(basename "$0") <drive_id>     # Close the specific drive

Environment overrides (optional):
  DC_CMD              Docker Compose command (default: "docker compose")
  TESLAMATE_SERVICE   Compose service name for teslamate (default: "teslamate")
  DB_SERVICE          Compose service name for database (default: "database")
  DB_USER             Database user (default: "teslamate")
  DB_NAME             Database name (default: "teslamate")
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

close_one() {
  local id="$1"
  echo "➡️  Closing drive id=$id ..."
  
  # Temporarily disable exit on error for this command
  set +e
  ${DC_CMD} exec -T "${TESLAMATE_SERVICE}" bin/teslamate rpc "TeslaMate.Repo.get!(TeslaMate.Log.Drive, ${id}) |> TeslaMate.Log.close_drive()"
  local exit_code=$?
  set -e
  
  if [[ $exit_code -eq 0 ]]; then
    echo "✅ Closed drive id=${id}"
    return 0
  else
    echo "❌ Failed to close drive id=${id}" >&2
    return 1
  fi
}

if [[ $# -ge 1 && $1 =~ ^[0-9]+$ ]]; then
  # Close a single drive id passed as argument
  close_one "$1"
  exit $?
fi

echo "🔍 Querying unclosed drives from DB via ${DB_SERVICE} ..."
UNCL_OSED_IDS=$(
  ${DC_CMD} exec -T "${DB_SERVICE}" psql \
    -U "${DB_USER}" -d "${DB_NAME}" -t -A \
    -c "SELECT id FROM drives WHERE end_date IS NULL ORDER BY id;" || true
)

if [[ -z "${UNCL_OSED_IDS}" ]]; then
  echo "👌 No unclosed drives found."
  exit 0
fi

echo "Found the following unclosed drive IDs:"
echo "${UNCL_OSED_IDS}" | sed 's/^/- /'

# Convert to array to avoid subshell issues
readarray -t drive_ids <<< "${UNCL_OSED_IDS}"

echo "🚀 Closing drives..."
for did in "${drive_ids[@]}"; do
  [[ -z "${did}" ]] && continue
  if ! close_one "${did}"; then
    echo "⚠️  Continuing with next drive despite failure..."
  fi
done

echo "🎉 All done."