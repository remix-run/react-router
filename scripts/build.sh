#!/bin/bash -e

npm run build
npm run build-umd
npm run build-min

echo "gzipped, the UMD build is `gzip -c lib/umd/ReactRouter.min.js | wc -c | sed -e 's/^[[:space:]]*//'` bytes"
