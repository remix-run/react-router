#!/bin/bash -e

babel=node_modules/.bin/babel
webpack=node_modules/.bin/webpack

rm -rf build

$babel -d build ./modules
find -X build -type d -name __tests__ | xargs rm -rf
NODE_ENV=production $webpack modules/index.js build/umd/ReactRouter.js
NODE_ENV=production COMPRESS=1 $webpack modules/index.js build/umd/ReactRouter.min.js

echo "gzipped, the global build is `gzip -c build/umd/ReactRouter.min.js | wc -c | sed -e 's/^[[:space:]]*//'` bytes"
