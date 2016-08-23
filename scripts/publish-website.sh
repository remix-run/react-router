#!/bin/sh -e
export NODE_ENV=production

echo "[publish-website] starting"
cd website

echo "[publish-website] webpacking"
webpack

echo "[publish-website] pushing to gh-pages"
cd build
cp index.html 404.html
git init .
git remote add origin git@github.com:ReactJSTraining/react-router.git
git checkout -b gh-pages
git add .
git commit -m 'publish'
git push origin gh-pages --force
cd ..

echo "[publish-website] cleaning up"
rm -rf build

echo "[publish-website] done"
