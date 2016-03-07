# Server Rendering

Server rendering is a bit different than in a client because you'll want to:

- Send `500` responses for errors
- Send `30x` responses for redirects
- Fetch data before rendering (and use the router to help you do it)

To facilitate these needs, you drop one level lower than the [`<Router>`](/docs/API.md#Router) API with:  

- [`match`](/docs/API.md#match-routes-location-history-options--cb) to match the routes to a location without rendering
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

## Async Routes

Server rendering works identically when using async routes. However, the client-side rendering needs to be a little different to make sure all of the async behavior has been resolved before the initial render, to avoid a mismatch between the server rendered and client rendered markup.

On the client, instead of rendering

```js
render(<Router history={history} routes={routes} />, mountNode)
```

You need to do

```js
match({ history, routes }, (error, redirectLocation, renderProps) => {
  render(<Router {...renderProps} />, mountNode)
})
```

## History singletons

Because the server has no DOM available, the history singletons (`browserHistory` and `hashHistory`) do not function on the server. Instead, they will simply return `undefined`.

You should be sure to only use the history singletons in client code. For React Components, this means using them only in lifecycle functions like `componentDidMount`, but not in `componentWillMount`. Most events, such as clicks, can only happen in the client, as the server has no DOM available to trigger them. So, using the history singletons is a valid option in that case. Knowing what code should run on the server and on the client is important to using React in a universal app, so make sure you're familiar with these concepts even if you aren't using React Router.

And don't feel discouraged! History singletons are a great convenience method to navigate without setting up `this.context` or when you're not inside of a React component. Simply take care to only use them in places the server will not try to touch.
