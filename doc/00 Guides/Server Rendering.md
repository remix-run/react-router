Rendering on the server is not much different than rendering in the
browser. The primary difference is that while on the client we can do
asynchronous work *after* rendering, on the server we have to do that
work *before* rendering, like path matching and data fetching.

We'll start with the client since its pretty simple. The only
interesting thing is that we are getting some initial data from the
server render to ensure that the first client render markup matches the
the markup from the server render. Without the initial data, the markup
the client creates would differ from what the server sent, and React
would replace the DOM.

```js
// client.js
import { Router } from 'react-router';
import './routes' from './routes';
React.render((
  <Router
    routes={routes}
    initialBranchData={window.__INITIAL_DATA_BRANCH__}
/>), document.getElementById('app'));
```

On the server, we need to asynchronously match the routes and fetch data
first, and then provide the initial stat to the router so it render
synchronously.

```js
// server.js
import { AsyncRouting, AsyncProps, Router } from 'react-router';
import routes from './routes';

// you'll want to configure your server to serve up static assets, and
// and then handle the rest with React Router
serveNonStaticPaths((req, res) => {
  AsyncRouting.match(req.path, routes, (err, initialRoutingState) => {
    AsyncProps.load(initialRoutingState, (err, initialBranchData) => {
      var html = React.renderToString((
        <Router
          initialRoutingState={initialRoutingState}
          initialBranchData={initialBranchData}
        />
      ));
      res.send(renderFullPage(html));
    });
  });
});

function renderFullPage(html, asyncProps) {
  return `
<!doctype html>
<html>
  <meta charset="utf-8"/>
  <head>
    <title>Sorry, no answers for you here</title>
  </head>
  <body>
    <div id="app">${html}</div>
    <script>
     ${/* put this here for the client to pick up */}
      __ASYNC_PROPS__ = ${JSON.stringify(asyncProps)};
    </script>
  </body>
</html>
`
}
```

API Routes
----------

Sometimes servers function as both the UI server and the api server. Do
your best to think of them separately.

While historically we've allowed one URL to function as both an API and
a UI server that branches behavior on the "accepts" header, you're
better off just having separate routes.  Might I suggest you namespace
your api routes with `/api/...`?

You could certainly add methods to your React Router routes to handle
API requests, match the routes, inspect the accepts header, then call
the methods on your route instead of rendering the components. I was
about to tell you not to do this, but please do and let us know how it
goes. Most of us should probably just use the server side router from
our favorite libraries for now, though.

Async Routes
------------

The previous example assumed a non-async route config. If you're using
the async features (`getChildRoutes`, `getComponents`) you can read from
`document.location` to asynchronously match before the initial render in
the client, just like the server.

```js
// client.js
import { Router, AsyncRouting } from 'react-router';
import './routes' from './routes';
var path = location.pathname+location.search;
AsyncRouting.match(path, (err, initialRoutingState) => {
  React.render((
    <Router
      routes={routes}
      initialRoutingState={initialRoutingState}
      initialBranchData={window.__INITIAL_DATA_BRANCH__}
  />), document.getElementById('app'));
});
```

