#!/bin/bash -e

changelog=node_modules/.bin/changelog

update_version() {
  echo "$(node -p "p=require('./${1}');p.version='${2}';JSON.stringify(p,null,2)")" > $1
  echo "Updated ${1} version to ${2}"
}

validate_semver() {
  if ! [[ $1 =~ ^[0-9]\.[0-9]+\.[0-9](-.+)? ]]; then
    echo "Version $1 is not valid! It must be a valid semver string like 1.0.2 or 2.3.0-beta.1"
    exit 1
  fi
}

current_version=$(node -p "require('./package').version")

printf "Next version (current is $current_version)? "
read next_version

validate_semver $next_version

next_ref="v$next_version"

npm test -- --single-run

update_version 'package.json' $next_version

$changelog -t $next_ref

npm run build
npm run build-umd
npm run build-min

echo "gzipped, the UMD build is `gzip -c lib/umd/ReactRouter.min.js | wc -c | sed -e 's/^[[:space:]]*//'` bytes"

git add -A lib
git commit -am "Version $next_version"

git tag $next_ref

git push origin master
git push origin $next_ref

npm publish --tag beta

