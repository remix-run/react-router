#!/bin/bash

set -x
set -e

COMMAND=$1

if [[ "${COMMAND}" != "start" && "${COMMAND}" != "finish" ]]; then
  echo "Usage: $0 <start|finish>"
  exit 1
fi

if [[ "${COMMAND}" == "start" ]]; then

  if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Your git working directory is not clean. Please commit or stash your changes."
    exit 1
  fi

  set +e
  git ls-remote --exit-code --heads origin release
  EXIT_CODE=$?
  if [[ $EXIT_CODE == '0' ]]; then
    echo "Error: Remote branch 'release' already exists."
    exit 1
  fi
  set -e

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

elif [[ "${COMMAND}" == "finish" ]]; then

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "${CURRENT_BRANCH}" != "release" ]]; then
    echo "Error: Script must be run from the 'release' branch."
    exit 1
  fi

  if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Your git working directory is not clean. Please commit or stash your changes."
    exit 1
  fi

  git pull
  git checkout main
  git pull
  git merge release --no-edit

  if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Your git working directory is not clean after the merge to main."
    exit 1
  fi

  git push

  git checkout dev
  git pull
  git merge release --no-edit

  if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Your git working directory is not clean after the merge to dev."
    exit 1
  fi

  git push

  git branch -d release

fi

set +e
set +x
