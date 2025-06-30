#!/bin/bash

set -e

pnpm clean

echo "Removing v6 artifacts..."
set -x
rm -rf packages/react-router-dom-v5-compat/
rm -f packages/react-router-dom/server.*
set +x

echo "Installing and building..."
pnpm install --frozen-lockfile
pnpm build