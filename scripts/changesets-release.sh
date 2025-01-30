#!/bin/bash

MODE=$(node -e "console.log(require('./.changeset/pre.json').mode)")

# Can only provide a custom --tag when not in prerelease mode
# The prerelease tags come from the pre.json "tag" field
if [ $MODE == "exit" ]; then
  pnpm exec changeset publish --tag v6
else
  pnpm exec changeset publish
fi
