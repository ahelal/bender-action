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

if [ "${1}" == "install" ]; then
	npm i -g @github/local-action
elif [ "${1}" == "job" ]; then
	local-action run "${ROOT_DIR}" src/index.ts "${LOCAL_ACTION_DIR}/.env"
elif [ "${1}" == "pr" ]; then
	# local-action run "${ROOT_DIR}" src/index.ts "${LOCAL_ACTION_DIR}/.env" "${LOCAL_ACTION_DIR}/workflow.yml"
	echo "not implemented"
else
	echo "Invalid argument, supported arrguments: install, job, pr"
	exit 1
fi

