#!/bin/bash

echo "Pruning tags before looking for tags to delete..."
git fetch --prune --prune-tags

PATTERN="@7\.\d\+\.\d\+-pre"

TAGS=$(git tag | grep -e "${PATTERN}")

if [[ $TAGS == "" ]]; then
  echo "No tags to delete, exiting"
  exit 0
fi

# Delay setting this because if it's set when no tags exist the program exits
# on the TAGS assignment above
set -e

NUM_TAGS=$(git tag | grep -e "${PATTERN}" | wc -l | sed 's/ //g')
TAGS_LINE=$(git tag | grep -e "${PATTERN}" | tr '\n' ' ')

echo ""
echo "Found ${NUM_TAGS} tags to delete. To delete, run the following commands:"
echo ""
echo "git push origin --delete ${TAGS_LINE}"
echo "git fetch --prune --prune-tags"
echo ""
echo ""

set +e
