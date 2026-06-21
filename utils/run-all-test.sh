#!/usr/bin/env bash
# Run the same checks as .github/workflows/build-test-webapp.yml before committing.
# Usage: from repo root: ./utils/run-all-test.sh
#        or: bash /path/to/retentio-webapp/utils/run-all-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

export HUSKY=0

if ! command -v pnpm >/dev/null 2>&1; then
  echo 'error: pnpm is not installed or not on PATH' >&2
  exit 1
fi

echo '==> pnpm install --frozen-lockfile'
pnpm install --frozen-lockfile

echo '==> pnpm run lint:ci'
pnpm run lint:ci

echo '==> pnpm run test'
pnpm run test

echo '==> pnpm run build'
pnpm run build

echo '==> playwright install chromium (with system deps if needed)'
pnpm exec playwright install --with-deps chromium

echo '==> pnpm run test:e2e'
{ read -r E2E_USERNAME; read -r E2E_PASSWORD; } < <(node -e "
  require('@next/env').loadEnvConfig(process.cwd());
  console.log(process.env.E2E_USERNAME || '');
  console.log(process.env.E2E_PASSWORD || '');
")
export E2E_USERNAME E2E_PASSWORD
if [[ -n "${E2E_USERNAME:-}" && -n "${E2E_PASSWORD:-}" ]]; then
  CI=true pnpm run test:e2e
else
  echo 'warning: E2E_USERNAME/E2E_PASSWORD not set — skipping e2e (add to .env.local or export to mirror CI)' >&2
fi

echo '==> OK — same steps as CI (build-test-webapp) passed.'
