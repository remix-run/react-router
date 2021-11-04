#!/bin/bash

set -e

PUBLIC_PATH="${PUBLIC_PATH:-/}"
DEPLOY_TOKEN=$1

root_dir="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)")"
tmp_dir="/tmp/reactrouter-website"

# Clone reactrouter-website repo into the tmp dir
rm -rf $tmp_dir
git clone --depth 2 --branch v5 "https://${DEPLOY_TOKEN}@github.com/remix-run/reactrouter-website.git" $tmp_dir

# Build the website into the public dir
rm -rf "$tmp_dir/public"
cd "$root_dir/website"
yarn
yarn build --output-path "$tmp_dir/public" --output-public-path $PUBLIC_PATH

# Commit all changes
cd $tmp_dir

git config --global user.email "github-actions@remix.run"
git config --global user.name "GitHub Actions"

git add -A
git commit -m "Update React Router v5 website"

echo "https://github.com/remix-run/reactrouter-website/actions/workflows/deploy.yml"

# Deploy
git push origin v5
