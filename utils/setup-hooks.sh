#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .husky
chmod +x .husky/pre-commit

echo "Git hooks path: .husky"
echo "Pre-commit runs lint-staged (see package.json → lint-staged)."
echo "Install deps so lint-staged exists: pnpm install   (or npm install)"
