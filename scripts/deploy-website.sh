#!/bin/bash

set -e

PUBLIC_PATH="${PUBLIC_PATH:-/react-router/}"

root_dir="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)")"
tmp_dir="/tmp/reacttraining.com"

# Clone reacttraining.com repo into the tmp dir
rm -rf $tmp_dir
git clone --depth 2 --branch main "git@github.com:remix-run/reactrouter.com.git" $tmp_dir

# Build the website into the static/react-router dir
rm -rf "$tmp_dir/static/react-router"
cd "$root_dir/website"
yarn
yarn build --output-path "$tmp_dir/static/react-router" --output-public-path $PUBLIC_PATH

# Commit all changes
cd $tmp_dir
git add -A
git commit \
	--author "Travis CI <travis-ci@reacttraining.com>" \
  -m "Update react-router website

$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"

# Deploy
git push origin main
