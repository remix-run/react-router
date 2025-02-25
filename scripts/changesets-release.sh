#!/bin/bash

MODE=$(node -e "console.log(require('./.changeset/pre.json').mode)")

# Can only provide a custom --tag when not in prerelease mode
# The prerelease tags come from the pre.json "tag" field
if [ "${MODE}" == "exit" ]; then
  echo "Publishing with v6 tag (stable release)"
  pnpm exec changeset publish --tag v6
else
  echo "Publishing with default changesets tag (pre-release)"
  pnpm exec changeset publish
fi
