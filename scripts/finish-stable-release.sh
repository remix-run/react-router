#!/bin/bash

set -x
set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "${CURRENT_BRANCH}" != "release-next" ]]; then
  echo "Error: Script must be run from the 'release-next' branch."
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean. Please commit or stash your changes."
  exit 1
fi

git pull
git checkout main
git pull
git merge release-next --no-edit

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean after the merge to main."
  exit 1
fi

git push

git checkout dev
git pull
git merge release-next --no-edit

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean after the merge to dev."
  exit 1
fi

git push

set +e
set +x