export default (assets, state, markup) => `
<!doctype html>
<html lang="">
<head>
  <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
  <meta charSet='utf-8' />
  <title>Welcome to Razzle</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${assets.client.css
    ? `<link rel="stylesheet" href="${assets.client.css}">`
    : ''}
  <script src="${assets.client.js}" defer></script>
</head>
<body style="margin:0">
  <div id="root">${markup}</div>
  <script>window.__PRELOADED_STATE__ = ${JSON.stringify(state)};</script>
</body>
</html>`
