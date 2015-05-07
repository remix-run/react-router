#!/bin/bash -e

babel=node_modules/.bin/babel
webpack=node_modules/.bin/webpack
build_dir=lib

rm -rf $build_dir

$babel -d $build_dir ./modules
find -X $build_dir -type d -name __tests__ | xargs rm -rf
NODE_ENV=production $webpack modules/index.js $build_dir/umd/ReactRouter.js
NODE_ENV=production COMPRESS=1 $webpack modules/index.js $build_dir/umd/ReactRouter.min.js

echo "gzipped, the global build is `gzip -c $build_dir/umd/ReactRouter.min.js | wc -c | sed -e 's/^[[:space:]]*//'` bytes"
