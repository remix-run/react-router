#!/bin/bash -e

changelog=node_modules/.bin/changelog

update_version() {
  echo "$(node -p "p=require('./${1}');p.version='${2}';JSON.stringify(p,null,2)")" > $1
  echo "Updated ${1} version to ${2}"
}

current_version=$(node -p "require('./package').version")

printf "Next version (current is $current_version)? "
read next_version

if ! [[ $next_version =~ ^[0-9]\.[0-9]+\.[0-9](-.+)? ]]; then
  echo "Version must be a valid semver string, e.g. 1.0.2 or 2.3.0-beta.1"
  exit 1
fi

next_ref="v$next_version"

npm test -- --single-run

update_version 'package.json' $next_version
update_version 'bower.json' $next_version

$changelog -t $next_ref

npm run build
git add -A build

git commit -am "Version $next_version"

git tag $next_ref
git tag latest -f

git push origin master
git push origin $next_ref
git push origin latest -f

npm publish build

echo "# Publishing docs website"
npm run build-website
cd website
rm -rf .git
git init .
git remote add origin git@github.com:rackt/react-router.git
git checkout -b gh-pages
git add .
git commit -m 'publishing docs'
git push origin gh-pages -f
rm -rf .git
cd ..

