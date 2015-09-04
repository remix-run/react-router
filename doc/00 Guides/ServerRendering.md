## Server Rendering

Rendering on the server is not much different than rendering in the browser. The primary difference is that while on the client we can do asynchronous work *after* rendering, on the server we have to do that work *before* rendering, like path matching and data fetching.

We'll start with the client since it's pretty simple. The only interesting thing is that we are getting some initial data from the server render to ensure that the first client render markup matches the the markup from the server render. Without the initial data, the markup the client creates would differ from what the server sent, and React would replace the DOM.

```js
// browser.js
import createHistory from 'history/lib/createBrowserHistory';
import Router from 'react-router';
import routes from './routes';

React.render(
  <Router history={createHistory()} children={routes}/>,
  document.getElementById('app')
);
```

On the server, we need to asynchronously match the routes and fetch data first, and then provide the initial state to the router so it renders synchronously.

```js
// server.js
import createLocation from 'history/lib/createLocation';
import Router from 'react-router';
import routes from './routes';

// you'll want to configure your server to serve up static assets
// and then handle the rest with React Router. this example assumes
// an express-like API
serveNonStaticPaths((req, res) => {
  // create a location object that tells the router what to render
  var location = createLocation(req.originalUrl);

  Router.run(routes, location, (error, initialState, redirectInfo) => {
    // do your own data fetching, perhaps using the
    // branch of components in the initialState
    fetchSomeData(initialState.components, (error, initialData) => {
      var html = React.renderToString(<Router initialState={initialState} />);
      res.send(renderFullPage(html, initialData));
    });
  });
});

function renderFullPage(html, initialData) {
  return `
<!doctype html>
<html>
  <body>
    <div id="app">${html}</div>
    <script>
     ${/* put this here for the client to pick up, you'll need your
          components to pick up this stuff on the first render */}
      __INITIAL_DATA__ = ${JSON.stringify(initialData)};
    </script>
  </body>
</html>
`
}
```

### API Routes

Sometimes servers function as both the UI server and the API server. Do your best to think of them separately.

While historically we've allowed one URL to function as both an API and a UI server that branches behavior on the "accepts" header, you're better off just having separate routes.  Might I suggest you namespace your API routes with `/api/...`?

You could certainly add methods to your React Router routes to handle API requests, match the routes, inspect the accepts header, then call the methods on your route instead of rendering the components. I was about to tell you not to do this, but please do and let us know how it goes. Most of us should probably just use the server side router from our favorite libraries for now, though.
