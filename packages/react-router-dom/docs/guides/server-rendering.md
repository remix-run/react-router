# Server Rendering

Rendering on the server is a bit different since it's all stateless. The basic idea is that we wrap the app in a stateless [`<StaticRouter>`][staticrouter] instead of a [`<BrowserRouter>`][browserrouter]. We pass in the requested url from the server so the routes can match and a `context` prop we'll discuss next.

```jsx
// client
<BrowserRouter>
  <App/>
</BrowserRouter>

// server (not the complete story)
<StaticRouter
  location={req.url}
  context={context}
>
  <App/>
</StaticRouter>
```

When you render a [`<Redirect>`][redirect] on the client, the browser history changes state and we get the new screen. In a static server environment we can't change the app state. Instead, we use the `context` prop to find out what the result of rendering was. If we find a `context.url`, then we know the app redirected. This allows us to send a proper redirect from the server.

```jsx
const context = {};
const markup = ReactDOMServer.renderToString(
  <StaticRouter location={req.url} context={context}>
    <App />
  </StaticRouter>
);

if (context.url) {
  // Somewhere a `<Redirect>` was rendered
  redirect(301, context.url);
} else {
  // we're good, send the response
}
```

## Adding app specific context information

The router only ever adds `context.url`. But you may want some redirects to be 301 and others 302. Or maybe you'd like to send a 404 response if some specific branch of UI is rendered, or a 401 if they aren't authorized. The context prop is yours, so you can mutate it. Here's a way to distinguish between 301 and 302 redirects:

```jsx
const RedirectWithStatus = ({ from, to, status }) => (
  <Route
    render={({ staticContext }) => {
      // there is no `staticContext` on the client, so
      // we need to guard against that here
      if (staticContext) staticContext.status = status;
      return <Redirect from={from} to={to} />;
    }}
  />
);

// somewhere in your app
const App = () => (
  <Switch>
    {/* some other routes */}
    <RedirectWithStatus status={301} from="/users" to="/profiles" />
    <RedirectWithStatus status={302} from="/courses" to="/dashboard" />
  </Switch>
);

// on the server
const context = {};

const markup = ReactDOMServer.renderToString(
  <StaticRouter context={context}>
    <App />
  </StaticRouter>
);

if (context.url) {
  // can use the `context.status` that
  // we added in RedirectWithStatus
  redirect(context.status, context.url);
}
```

## 404, 401, or any other status

We can do the same thing as above. Create a component that adds some context and render it anywhere in the app to get a different status code.

```jsx
const Status = ({ code, children }) => (
  <Route
    render={({ staticContext }) => {
      if (staticContext) staticContext.status = code;
      return children;
    }}
  />
);
```

Now you can render a `Status` anywhere in the app that you want to add the code to `staticContext`.

```jsx
const NotFound = () => (
  <Status code={404}>
    <div>
      <h1>Sorry, can’t find that.</h1>
    </div>
  </Status>
)

// somewhere else
<Switch>
  <Route path="/about" component={About}/>
  <Route path="/dashboard" component={Dashboard}/>
  <Route component={NotFound}/>
</Switch>
```

## Putting it all together

This isn't a real app, but it shows all of the general pieces you'll
need to put it all together.

```jsx
import { createServer } from "http";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App";

createServer((req, res) => {
  const context = {};

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  );

  if (context.url) {
    res.writeHead(301, {
      Location: context.url
    });
    res.end();
  } else {
    res.write(`
      <!doctype html>
      <div id="app">${html}</div>
    `);
    res.end();
  }
}).listen(3000);
```

And then the client:

```jsx
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("app")
);
```

## Data Loading

There are so many different approaches to this, and there's no clear best practice yet, so we seek to be composable with any approach, and not prescribe or lean toward one or the other. We're confident the router can fit inside the constraints of your application.

The primary constraint is that you want to load data before you render. React Router exports the `matchPath` static function that it uses internally to match locations to routes. You can use this function on the server to help determine what your data dependencies will be before rendering.

The gist of this approach relies on a static route config used to both render your routes and match against before rendering to determine data dependencies.

```js
const routes = [
  {
    path: "/",
    component: Root,
    loadData: () => getSomeData()
  }
  // etc.
];
```

Then use this config to render your routes in the app:

```jsx
import { routes } from "./routes";

const App = () => (
  <Switch>
    {routes.map(route => (
      <Route {...route} />
    ))}
  </Switch>
);
```

Then on the server you'd have something like:

```js
import { matchPath } from "react-router-dom";

// inside a request
const promises = [];
// use `some` to imitate `<Switch>` behavior of selecting only
// the first to match
routes.some(route => {
  // use `matchPath` here
  const match = matchPath(req.path, route);
  if (match) promises.push(route.loadData(match));
  return match;
});

Promise.all(promises).then(data => {
  // do something w/ the data so the client
  // can access it then render the app
});
```

And finally, the client will need to pick up the data. Again, we aren't in the business of prescribing a data loading pattern for your app, but these are the touch points you'll need to implement.

You might be interested in our [React Router Config][rrc] package to assist with data loading and server rendering with static route configs.

[staticrouter]: ../api/StaticRouter.md
[browserrouter]: ../api/BrowserRouter.md
[redirect]: ../api/Redirect.md
[rrc]: https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config
