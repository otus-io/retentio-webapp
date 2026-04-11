#!/usr/bin/env bash
# Run the same checks as .github/workflows/build-test-webapp.yml (lint + production build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo 'error: pnpm is not installed or not on PATH' >&2
  exit 1
fi

echo '==> pnpm install --frozen-lockfile'
pnpm install --frozen-lockfile

echo '==> pnpm run lint:ci'
pnpm run lint:ci

echo '==> pnpm run build'
pnpm run build

echo '==> OK — same steps as CI (build-test-webapp) passed.'
