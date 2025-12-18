#!/usr/bin/env bash
set -euo pipefail

cd "${CONDUCTOR_WORKSPACE_PATH:-.}"

FNM_DIR="${FNM_DIR:-$HOME/.fnm}"
export PATH="$FNM_DIR:$HOME/.local/bin:$PATH:/opt/homebrew/bin:/usr/local/bin"

command -v fnm >/dev/null 2>&1 || { echo "[setup] fnm not found"; exit 1; }
eval "$(fnm env --shell bash)"

fnm install 20
fnm use 20
echo "[setup] node: $(node -v)"

corepack enable
corepack prepare pnpm@10.13.1 --activate
echo "[setup] pnpm: $(pnpm -v)"

pnpm install --frozen-lockfile