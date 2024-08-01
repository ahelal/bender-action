#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd)"
ROOT_DIR="$( cd "${SCRIPT_DIR}"/../../ && pwd)"

local-action run ${ROOT_DIR} src/index.js ${ROOT_DIR}/tests/local-action/.env
