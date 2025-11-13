#!/bin/bash

set -x
set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "${CURRENT_BRANCH}" != "release-v6" ]]; then
  echo "Error: Script must be run from the 'release-v6' branch."
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean. Please commit or stash your changes."
  exit 1
fi

git pull
git checkout v6
git pull
git merge release-v6 --no-edit

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Your git working directory is not clean after the merge to main."
  exit 1
fi

git push
git branch -d release-v6

if [[ -n $(git show-ref refs/heads/changeset-release/release-v6) ]]; then
  git branch -D changeset-release/release-v6
fi

set +e
set +x