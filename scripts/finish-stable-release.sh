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

git branch -d release-next

if [[ -n $(git show-ref refs/heads/changeset-release/release-next) ]]; then
  git branch -d changeset-release/release-next
fi

# If this is set when no tags exist the program exits on the TAGS assignment
set +e

echo "Pruning tags before looking for tags to delete:"
git fetch --prune --prune-tags

PATTERN="@7\.\d\+\.\d\+-pre"

# Don't keep around prerelease tags for all packages - only the `react-router` package
TAGS=$(git tag | grep -e "${PATTERN}" | grep -ve "^react-router@")

if [[ $TAGS == "" ]]; then
  echo "No tags to delete, exiting"
  exit 0
fi

set -e

NUM_TAGS=$(git tag | grep -e "${PATTERN}" | grep -ve "^react-router@" | wc -l | sed 's/ //g')
TAGS_LINE=$(git tag | grep -e "${PATTERN}" | grep -ve "^react-router@" | tr '\n' ' ')

echo "Found ${NUM_TAGS} tags to delete: ${TAGS_LINE}"

echo "To delete, run the following commands:"
echo ""
echo "git push origin --delete ${TAGS_LINE}"
echo "git fetch --prune --prune-tags"

set +e
set +x


set +e
set +x