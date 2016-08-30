# `<ServerRouter>`

Renders of your React Router app on the server and notifies you of
redirects or `Miss` rendering.

This is a very bare-bones example to illustrate the moving parts that
involve `ServerRouter`, the rest is up to you.

```js
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'http'

createServer((req, res) => {

  // ServerRouter will callback to us if there is a redirect or Miss
  // while rendering
  let redirectLocation = null
  let missLocation = null

  const markup = renderToString(
    <ServerRouter
      location={req.url}
      onRedirect={location => redirectLocation}
      onMiss={location => missLocation}
    >
      <App/>
    </ServerRouter>
  )

  if (redirectLocation) {
    res.writeHead(301, {
      Location: redirectLocation.pathname
    })
    res.end()
  } else {
    if (missLocation) {
      res.writeHead(404)
    }
    res.write(markup)
    res.end()
  }


}).listen(3000)
```

## `location`

The location the server received, probably the string on `req.url` of a
node server.

## `onRedirect`

Called when any Redirect happens while rendering your app. It calls back
with the location of the redirect so you can send a proper 301 (or 302).

## `onMiss`

If any `Miss` components are rendered, this will be called with the
location so you can send a proper 404 response with the content.

# `</ServerRouter>`
