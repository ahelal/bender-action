#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd)"
ROOT_DIR="$( cd "${SCRIPT_DIR}"/../../ && pwd)"
TEST_DIR="$( cd "${ROOT_DIR}/__tests__/" && pwd)"
LOCAL_ACTION_DIR="$( cd "${ROOT_DIR}/__tests__/local-action" && pwd)"

local-action run ${ROOT_DIR} src/index.ts ${LOCAL_ACTION_DIR}/.env
