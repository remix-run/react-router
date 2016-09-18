# `<ServerRouter>`

Server rendering is a bit more involved to properly handle `<Redirect>`
and `<Miss>` in your app. Not only do you want to respond with the
proper status code, but also, both function on the result of rendering
so we have to sort of recreate `componentDidMount` for the server. For
the exceptional case of not matching any patterns you'll use a two-pass
render to render the `<Miss>` components.

Here's an example that sends 301 for redirects and properly renders your
app when no patterns match the url:

```js
import { createServer } from 'http'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { ServerRouter, createServerRenderContext } from 'react-router'

createServer((req, res) => {

  // first create a context for <ServerRouter>, it's where we keep the
  // results of rendering for the second pass if necessary
  const context = createServerRenderContext()

  // render the first time
  let markup = renderToString(
    <ServerRouter
      location={req.url}
      context={context}
    >
      <App/>
    </ServerRouter>
  )

  // get the result
  const result = context.getResult()

  // the result will tell you if it redirected, if so, we ignore
  // the markup and send a proper redirect.
  if (result.redirect) {
    res.writeHead(301, {
      Location: result.redirect.pathname
    })
    res.end()
  } else {

    // the result will tell you if there were any misses, if so
    // we can send a 404 and then do a second render pass with
    // the context to clue the <Miss> components into rendering
    // this time (on the client they know from componentDidMount)
    if (result.missed) {
      res.writeHead(404)
      markup = renderToString(
        <ServerRouter
          location={req.url}
          context={context}
        >
          <App/>
        </ServerRouter>
      )
    }
    res.write(markup)
    res.end()
  }
}).listen(3000)
```

## `location: string`

The location the server received, probably `req.url` on a node server.

## `context`

An object returned from `createServerRenderContext`. It keeps the
rendering result so you know which status code to send and if you need
to perform a second pass render to render the `<Miss>` components in
your app.

# `</ServerRouter>`
