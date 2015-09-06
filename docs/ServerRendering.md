# Server Rendering

Server rendering is a bit different than in a client because you'll want
to:

- Send `500` responses for errors
- Send `30x` responses for redirects
- Fetch data before rendering (and use the router to help you do it)

To facilitate these needs, you drop one level lower than the `<Router/>`
API with

- `createLocation` from the history package
- `match` to match the routes to a location without rendering
- `RoutingContext` for synchronous rendering of route components

It looks something like this with an imaginary JavaScript server:

```js
import createLocation from 'history/lib/createLocation'
import { RoutingContext, match } from 'react-router'
import routes from './routes'
import { renderToString } from 'react-dom/server'

serve((req, res) => {
  let location = createLocation(req.url)
  match(routes, location, (err, props, redirectInfo) => {
    if (redirectInfo)
      res.redirect(redirectInfo.path)
    else if (err)
      res.error(err.message)
    else
      res.send(renderToString(<RoutingContext {...props}/>))
  })
})
```

For data loading, you can use the `props` argument to build whatever
convention you want--like adding static `load` methods to your route
components, or putting data loading functions on the routes, its up to
you.

