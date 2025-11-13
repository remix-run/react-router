#!/bin/bash

set -x
set -e

if [[ $(git branch --show-current) != "v6" ]]; then
  echo "Error: Current branch must be v6"
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean. Please commit or stash your changes."
  exit 1
fi

git pull
git checkout -b release-v6
pnpm changeset pre enter pre-v6
git add .changeset/pre.json
git commit -m "Enter prerelease mode"
git push --set-upstream origin release-v6

set +e
set +x