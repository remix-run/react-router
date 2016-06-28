#!/bin/sh -e
cd docs
git init .
rm index.html
mv gh-pages.html 404.html
git remote add origin git@github.com:ReactJSTraining/react-router.git
git checkout -b gh-pages
webpack
git add .
git commit -m 'publish'
git push origin gh-pages --force
rm -rf .git
rm -rf build
git checkout index.html
mv 404.html gh-pages.html

