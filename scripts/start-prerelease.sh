#!/bin/bash

set -x
set -e

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean. Please commit or stash your changes."
  exit 1
fi

git checkout main
git pull
git checkout dev
git pull
git checkout -b release-next
git merge main --no-edit

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean after merging main ito release-next."
  exit 1
fi

pnpm changeset pre enter pre
git add .changeset/pre.json
git commit -m "Enter prerelease mode"
git push --set-upstream origin release-next

set +e
set +x