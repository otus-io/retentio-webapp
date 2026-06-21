#!/usr/bin/env bash
# Run the same checks as .github/workflows/build-test-deploy-webapp.yml (lint, unit tests, build, e2e).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo 'error: pnpm is not installed or not on PATH' >&2
  exit 1
fi

echo '==> pnpm install --frozen-lockfile'
HUSKY=0 pnpm install --frozen-lockfile

echo '==> pnpm run lint:ci'
pnpm run lint:ci

echo '==> pnpm run test'
pnpm run test

echo '==> pnpm run build'
pnpm run build

echo '==> playwright install chromium (with system deps if needed)'
pnpm exec playwright install --with-deps chromium

echo '==> pnpm run test:e2e'
CI=true pnpm run test:e2e

echo '==> OK — same steps as CI (build-test-deploy-webapp) passed.'
