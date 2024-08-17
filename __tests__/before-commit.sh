#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}"/../ && pwd)"

cd "$ROOT_DIR"

echo "* Format check"
npm run format:check
echo ""

echo "* Test"
npm run test
echo ""

echo "* Lint"
npm run lint
echo ""

echo "* bundle"
npm run bundle
echo ""
