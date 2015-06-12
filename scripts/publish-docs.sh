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

