# &lt;StaticRouter>

A [`<Router>`](Router.md) that never changes location.

This can be useful in server-side rendering scenarios when the user isn't actually clicking around, so the location never actually changes. Hence, the name: static. It's also useful in simple tests when you just need to plug in a location and make assertions on the render output.

Here's an example node server that sends a 302 status code for [`<Redirect>`](Redirect.md)s and regular HTML for other requests:

```js
import { createServer } from 'http'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'

createServer((req, res) => {

  // This context object contains the results of the render
  const context = {}

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <App/>
    </StaticRouter>
  )

  // context.url will contain the URL to redirect to if a <Redirect> was used
  if (context.url) {
    res.writeHead(302, {
      Location: context.url
    })
    res.end()
  } else {
    res.write(html)
    res.end()
  }
}).listen(3000)
```

## basename: string

The base URL for all locations. A properly formatted basename should have a leading slash, but no trailing slash.

```js
<StaticRouter basename="/calendar">
  <Link to="/today"/> // renders <a href="/calendar/today">
</StaticRouter>
```

## location: string

The URL the server received, probably `req.url` on a node server.

```js
<StaticRouter location={req.url}>
  <App/>
</StaticRouter>
```

## location: object

A location object shaped like `{ pathname, search, hash, state }`

```js
<StaticRouter location={{ pathname: '/bubblegum' }}>
  <App/>
</StaticRouter>
```

## context: object

A plain JavaScript object that records the results of the render. See the example above.

## children: node

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
