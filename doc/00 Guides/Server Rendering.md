Rendering on the server is not much different than rendering in the
browser. The primary difference is that while on the client we can do
asynchronous work *after* rendering, on the server we have to do that
work *before* rendering, like path matching and data fetching.

Basics
------

We start with an `App` we can use on the client and the server.

```js
// App.js
import {
  BrowserHistory,
  RouteMatcher,
  Transitions,
  RestoreScroll,
} from 'react-router';

import routes from './routes';

var App = React.createClass({
  render () {
    return (
      <BrowserHistory>
        <RouteMatcher {...this.props} routes={routes}>
          <Transitions>
            <RestoreScroll/>
          </Transitions>
        </RouteMatcher>
      </BrowserHistory>
    );
  }
}
```

Then in the client we just render as usual:

```js
// client.js
import App from './App';
React.render(<App/>, document.getElementById('app'));
```

On the server, we need to match first, and then provide the initial
state to the router so it can render synchronously.

```js
// server.js
import { match } from 'react-router';
import routes from './routes';
import App from './App';

// you'll want to configure your server to serve up static assets, and
// and then handle the rest with React Router
serveNonStaticPaths((req, res) => {
  // send the server side path and our routes to the `match` helper
  match(req.path, routes, (err, initialState) => {
    // pass the initial router state into app via props, which just
    // passes it along to `RouteMatcher`, so that router can render w/o
    // doing any asynchronous work
    var html = React.renderToString(<App {...initialState} />);
    res.send(renderFullPage(html));
  });
});

function renderFullPage(html) {
  // browsers don't really like it when react messes with stuff outside
  // of <body>, here we're just using es6 string templates, you can do
  // whatever you want.
  return `
<!doctype html>
<html>
  <meta charset="utf-8"/>
  <head>
    <title>Sorry, no answers for you here</title>
  </head>
  <body>
    <div id="app">${html}</div>
  </body>
</html>
`
}
```

With `AsyncProps`
----------------

One major concern for server rendering is loading data before you
render. While on the client we can fetch data in the render lifecycle,
on the server we need to do that work first. `AsyncProps` does the dirty
work, but you have to do a little bit more on the server to make it
happen.

```js
// App.js
import {
  BrowserHistory,
  RouteMatcher,
  Transitions,
  RestoreScroll,
  // import AsyncProps
  AsyncProps
} from 'react-router';

import routes from './routes';

var App = React.createClass({
  render () {
    return (
      <BrowserHistory>
        <RouteMatcher {...this.props} routes={routes}>
          <Transitions>
            {/* add in AsyncProps middleware and give it a cache token */}
            <AsyncProps token={this.props.token}>
              <RestoreScroll/>
            </AsyncProps>
          </Transitions>
        </RouteMatcher>
      </BrowserHistory>
    );
  }
}
```

The client doesn't change.

```js
// client.js
import App from './App';
React.render(<App />, document.getElementById('app'));
```

Now the server has the most changes, we need to:

1. Generate a token for AsyncProps to keep track of this request's data
   "hydration".
2. Fetch the data before rendering, so that we can render with data
   synchronously.
3. "Dehydrate" the data to the client so it can "rehydrate" it when the
   JavaScript app takes over.

```js
// server.js
import { match, AsyncProps } from 'react-router';
import routes from './routes';
import App from './App';
import generateToken from 'one-of-86-token-generators-on-npm';

serveNonStaticPaths((req, res) => {
  // first we match, `AsyncProps` uses the route components to know what
  // data to fetch
  match(req.path, routes, (err, initialState) => {

    // generate a token to track the data for this request
    var token = generateToken();

    // fetch the data before rendering
    AsyncProps.hydrate(token, initialState, (err, data) => {

      // pass the token to our app so AsyncProps knows where to find the
      // data synchronously
      var html = React.renderToString(<App {...initialState} token={token} />);

      // Now we pass both the html and the data to `renderFullPage`
      // You must "dehydrate" the data on `window.__ASYNC_PROPS__` for
      // `AsyncProps` to know where to find the data on the client for
      // the initial render.
      res.send(renderFullPage(html, data));
    });
  });
});

function renderFullPage(html, data) {
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
      __ASYNC_PROPS__ = ${JSON.stringify(data, null, 2)};
    </script>
  </body>
</html>
`
}
```

That's it! You can use your own data provider middleware instead of
`AsyncProps` and choreograph your own dance, if you'd like.

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

