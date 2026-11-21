#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .husky
chmod +x .husky/pre-commit .husky/pre-push

echo "Git hooks path: .husky"
echo "Pre-commit runs lint-staged (see package.json → lint-staged)."
echo "Pre-push blocks pushes to main and runs Claude /code-review + /security-review (utils/pre-push)."
echo "Install deps so lint-staged exists: pnpm install   (or npm install)"
