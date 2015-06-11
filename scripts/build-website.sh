#!/bin/bash -e
branch=$(git branch | sed -n "/\* /s///p")
rm -rf tmp
mkdir tmp
cp -R website tmp/website
cp -R scripts tmp/scripts

versions="$(cat website/config)"

count=0
while read line
do
  if [ ! -f tmp/website/tags/$line.html ]; then
    git checkout "$line"
    ./node_modules/.bin/babel-node ./tmp/scripts/build-website-tag.js "$versions" > tmp/website/tags/$line.html
  fi

  if [ "$count" -eq 0 ]; then
    cp tmp/website/tags/$line.html tmp/website/index.html
  fi

  ((count++))
done < website/config

git checkout $branch
rm -rf website
mv tmp/website website
rm -rf tmp

