#!/bin/bash

set -e

PUBLIC_PATH="${PUBLIC_PATH:-/}"

root_dir="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)")"
tmp_dir="/tmp/reactrouter.com"
output_dir="$tmp_dir/public"

# Clone reacttraining.com repo into the tmp dir
rm -rf $tmp_dir
git clone --depth 2 --branch master "git@github.com:ReactTraining/reactrouter.com.git" $tmp_dir

# Build the website into the static/react-router dir
rm -rf "$output_dir"
cd "$root_dir/website"
yarn
yarn build --output-path "$output_dir" --output-public-path $PUBLIC_PATH

# Commit all changes
cd $tmp_dir
git add -A
git commit \
	--author "Travis CI <travis-ci@reacttraining.com>" \
  -m "Update react-router website

https://travis-ci.com/$TRAVIS_REPO_SLUG/builds/$TRAVIS_BUILD_ID"

# Deploy
git push origin master
