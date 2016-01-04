# Server Rendering

Server rendering is a bit different than in a client because you'll want to:

- Send `500` responses for errors
- Send `30x` responses for redirects
- Fetch data before rendering (and use the router to help you do it)

To facilitate these needs, you drop one level lower than the [`<Router>`](/docs/API.md#Router) API with:  

- [`match`](/docs/API.md#match-routes-location-options--cb) to match the routes to a location without rendering
- `RouterContext` for synchronous rendering of route components

It looks something like this with an imaginary JavaScript server:

```js
import { renderToString } from 'react-dom/server'
import { match, RouterContext } from 'react-router'
import routes from './routes'

serve((req, res) => {
  // Note that req.url here should be the full URL path from
  // the original request, including the query string.
  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      res.status(200).send(renderToString(<RouterContext {...renderProps} />))
    } else {
      res.status(404).send('Not found')
    }
  })
})
```

For data loading, you can use the `renderProps` argument to build whatever convention you want--like adding static `load` methods to your route components, or putting data loading functions on the routes--it's up to you.
