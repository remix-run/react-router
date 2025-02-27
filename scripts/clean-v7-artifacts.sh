#!/bin/bash

set -e

pnpm clean

echo "Removing v7 directories..."
set -x
rm -rf packages/create-react-router/
rm -rf packages/react-router-architect/
rm -rf packages/react-router-cloudflare/
rm -rf packages/react-router-dev/
rm -rf packages/react-router-dom/.wireit/
rm -rf packages/react-router-express/
rm -rf packages/react-router-fs-routes/
rm -rf packages/react-router-node/
rm -rf packages/react-router-remix-routes-option-adapter/
rm -rf packages/react-router-serve/
rm -rf packages/react-router/.wireit/
rm -rf integration/
rm -rf playground/
rm -rf playground-local/
rm -rf public/dev/ # v7 API docs
set +x

echo "Installing and building..."
pnpm install --frozen-lockfile
pnpm build