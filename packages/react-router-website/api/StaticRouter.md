# &lt;StaticRouter> {id=staticrouter}

A "static" [router can be useful in server-side rendering scenarios when the user isn't actually clicking around, so the location never actually changes. Hence, the name static. It's also useful in simple tests when you just need to plug in a location and make assertions on the render output.

Here's an example node server that sends a 302 status code for `<Redirect>`s and regular HTML for other requests:

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

## basename: string _`<StaticRouter>`_ {id=staticrouter.basename}

The base URL for all locations.

```js
<StaticRouter basename="/calendar">
  <Link to="/today"/> // renders <a href="/calendar/today">
</StaticRouter>
```

## context: object _`<StaticRouter>`_ {id=staticrouter.context}

A plain JavaScript object that records the results of the render. See the example above.

## location: string _`<StaticRouter>`_ {id=staticrouter.location-string}

The URL the server received, probably `req.url` on a node server.

## location: object _`<StaticRouter>`_ {id=staticrouter.location-object}

A location object shaped like `{ pathname, search, hash, state }`

## children: node _`<StaticRouter>`_ {id=staticrouter.children}

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
