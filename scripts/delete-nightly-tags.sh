#!/bin/bash

echo "Pruning tags before looking for tags to delete..."
git fetch --prune --prune-tags

PATTERN="v*-nightly-*-*"

TAGS=$(git tag -l "${PATTERN}")

if [[ $TAGS == "" ]]; then
  echo "No tags to delete, exiting"
  exit 0
fi

# Delay setting this because if it's set when no tags exist the program exits
# on the TAGS assignment above
set -e

# Sort by date (YYYYMMDD suffix), keep the 50 most recent, delete the rest
TAGS_SORTED=$(git tag -l "${PATTERN}" | sort -t'-' -k4)
TOTAL=$(echo "${TAGS_SORTED}" | wc -l | tr -d ' ')
DELETE_COUNT=$(( TOTAL - 25 ))
TAGS_TO_DELETE=$(echo "${TAGS_SORTED}" | head -n "${DELETE_COUNT}")

if [[ $TAGS_TO_DELETE == "" ]]; then
  echo "25 or fewer nightly tags exist, nothing to delete"
  exit 0
fi

NUM_TAGS=$(echo "${TAGS_TO_DELETE}" | wc -l | sed 's/ //g')
TAGS_LINE=$(echo "${TAGS_TO_DELETE}" | tr '\n' ' ')

echo ""
echo "Found ${NUM_TAGS} tags to delete. To delete, run the following commands:"
echo ""
echo "git push origin --delete ${TAGS_LINE}"
echo "git fetch --prune --prune-tags"
echo ""
echo ""

set +e
