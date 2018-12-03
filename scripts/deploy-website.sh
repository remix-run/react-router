#!/bin/bash

PUBLIC_PATH="${PUBLIC_PATH:-/react-router/}"

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
tmp_dir="/tmp/reacttraining.com"

rm -rf $tmp_dir
git clone --depth 2 --branch master "git@github.com:ReactTraining/reacttraining.com.git" $tmp_dir

cd "$root_dir/website"

rm -rf "$tmp_dir/public/react-router"
npm run build -- --output-path "$tmp_dir/public/react-router" --output-public-path $PUBLIC_PATH

cd $tmp_dir

git add -A
git commit \
  -m "Update react-router website

https://travis-ci.org/$TRAVIS_REPO_SLUG/builds/$TRAVIS_BUILD_ID" \
  --author "Travis CI <travis@reacttraining.com>"

git push origin master
