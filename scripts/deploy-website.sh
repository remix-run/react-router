#!/bin/bash

set -e

public_path="${PUBLIC_PATH:-/}"
deploy_token=$1
root_dir="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)")"
tmp_dir="/tmp/reactrouter-website"

echo "Deploying React Router v5 website to https://v5.reactrouter.com"

# Clone reactrouter-website repo into the tmp dir
rm -rf $tmp_dir
git clone --depth 2 --branch v5 "https://${deploy_token}@github.com/remix-run/reactrouter-website.git" $tmp_dir

# Build the website into the public dir
rm -rf "$tmp_dir/public"
cd "$root_dir/website"
yarn
yarn build --output-path "$tmp_dir/public" --output-public-path $public_path

# Commit all changes
cd $tmp_dir

git config --global user.name "GitHub Actions"
git config --global user.email "github-actions@remix.run"

git add -A
git commit -m "Update React Router v5 website"

# Deploy
git push origin v5
