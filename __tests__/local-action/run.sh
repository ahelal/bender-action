#!/bin/bash
set -ex

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}"/../../ && pwd)"
# TEST_DIR="$( cd "${ROOT_DIR}/__tests__/" && pwd)"
LOCAL_ACTION_DIR="$(cd "${ROOT_DIR}/__tests__/local-action" && pwd)"

# if global npm package not installed, install it
if ! command -v local-action &>/dev/null; then
	npm i -g @github/local-action
fi

local-action run "${ROOT_DIR}" src/index.ts "${LOCAL_ACTION_DIR}/.env"
