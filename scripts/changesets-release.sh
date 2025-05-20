#!/bin/bash

PACKAGE="./packages/react-router/package.json"
IS_PRERELEASE=$(node -e "console.log(/-pre/.test(require('${PACKAGE}').version))")

# Can only provide a custom --tag when not in prerelease mode
# The prerelease tags come from the `pre.json`` "tag" field
if [ ${IS_PRERELEASE} == "true" ]; then
  echo "Publishing with default changesets tag (pre-release)"
  pnpm exec changeset publish
else
  echo "Publishing with v6 tag (stable release)"
  pnpm exec changeset publish --tag version-6
fi
