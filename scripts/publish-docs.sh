#!/bin/sh -e
export NODE_ENV=production

echo "[publish-docs] starting"
cd docs

echo "[publish-docs] webpacking"
webpack

echo "[publish-docs] pushing to gh-pages"
cd build
cp index.html 404.html
git init .
git remote add origin git@github.com:ReactJSTraining/react-router.git
git checkout -b gh-pages
git add .
git commit -m 'publish'
git push origin gh-pages --force
cd ..

echo "[publish-docs] cleaning up"
rm -rf build

echo "[publish-docs] done"
