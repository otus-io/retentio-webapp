#!/bin/bash

# Run the Next.js production server (expects `pnpm build` already done).
# Usage: from repo root: ./utils/run-prod.sh
#        or: bash /path/to/retentio-webapp/utils/run-prod.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

export HUSKY=0
export NODE_ENV=production

# systemd does not load login shells; mirror deploy-webapp.yml Node/pnpm setup.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use 20 2>/dev/null || nvm use default 2>/dev/null || true
fi
if [ -f "$HOME/.profile" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.profile"
fi
export PATH="$HOME/.local/share/pnpm:$HOME/.npm-global/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found on PATH" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found on PATH" >&2
  exit 1
fi

if [ ! -d "$REPO_ROOT/.next" ]; then
  echo "Missing .next build output; run pnpm build before starting" >&2
  exit 1
fi

exec pnpm start
