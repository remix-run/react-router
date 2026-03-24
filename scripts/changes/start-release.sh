#!/bin/bash

set -x
set -e

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean. Please commit or stash your changes."
  exit 1
fi

git ls-remote --exit-code --heads origin release
EXIT_CODE=$?
if [[ $EXIT_CODE == '0' ]]; then
  echo "Error: Remote branch 'release' already exists."
  exit 1
fi

git checkout main
git pull
git checkout dev
git pull
git checkout -b release
git merge main --no-edit

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean after merging main into release."
  exit 1
fi

git push --set-upstream origin release

set +e
set +x