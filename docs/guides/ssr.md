---
title: Server-Side Rendering
toc: false
order: 6
---

# Server Side Rendering

The most basic server rendering in React Router is pretty straightforward. However, there's a lot more to consider than just getting the right routes to render. Here's an incomplete list of things you'll need to handle:

- Bundling your code for the server and the browser
- Not bundling server-only code into the browser bundles
- Code splitting that works on the server and in the browser
- Server Side data loading so you actually have something to render
- Data loading strategies that work on the client and server
- Handling code splitting in the server and client
- Proper HTTP status codes and redirects
- Environment variables and secrets
- Deployment

Setting all of this up well can be pretty involved but is worth the performance and UX characteristics you can only get when server rendering.

If you want to server render your React Router app, we highly recommend you use [Remix][remix]. This is another project of ours that's built on top of React Router and handles all of the things mentioned above and more. Give it a shot!

If you want to tackle it on your own, you'll need to use `<StaticRouterProvider>` or `<StaticRouter>` on the server, depending on your choice of [router][picking-a-router]. If using `<StaticRouter>`, please jump down to the [Without a Data Router][ssr-non-data] section.

## With a Data Router

First, you'll need to define your routes for the data router, these routes will be used both on the server and in the client:

```js filename=routes.jsx
const React = require("react");
const { json, useLoaderData } = require("react-router-dom");

const routes = [
  {
    path: "/",
    loader() {
      return json({ message: "Welcome to React Router!" });
    },
    Component() {
      let data = useLoaderData();
      return <h1>{data.message}</h1>;
    },
  },
];

module.exports = routes;
```

<docs-info>We are using CJS modules in these examples for simplicity on the server but generally you'll use ESM modules and leverage a bundler such as `esbuild`, `vite`, or `webpack`.</docs-info>

With our routes defined, we can create a handler in our express server and load data for the routes using `createStaticHandler()`. Remember that the primary goal of a data router is decoupling the data fetching from rendering, so you'll see that when server-rendering with a data router we have distinct steps for fetching and rendering.

```js filename=server.jsx lines=[2-4,11,14-15]
const express = require("express");
const {
  createStaticHandler,
} = require("react-router-dom/server");

const createFetchRequest = require("./request");
const routes = require("./routes");

const app = express();

let handler = createStaticHandler(routes);

app.get("*", async (req, res) => {
  let fetchRequest = createFetchRequest(req, res);
  let context = await handler.query(fetchRequest);

  // We'll tackle rendering next...
});

const listener = app.listen(3000, () => {
  let { port } = listener.address();
  console.log(`Listening on port ${port}`);
});
```

Note we have to first convert the incoming Express request into a Fetch request, which is what the static handler methods operate on. The `createFetchRequest` method is specific to an Express request and in this example is extracted from the `@remix-run/express` adapter:

```js filename=request.js
module.exports = function createFetchRequest(req, res) {
  let origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  let url = new URL(req.originalUrl || req.url, origin);

  let controller = new AbortController();
  res.on("close", () => controller.abort());

  let headers = new Headers();

  for (let [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  let init = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
};
```

Once we've loaded our data by executing all of the matched route loaders for the incoming request, we use `createStaticRouter()` and `<StaticRouterProvider>` to render the HTML and send a response back to the browser:

```js filename=server.jsx lines=[5-16]
app.get("*", async (req, res) => {
  let fetchRequest = createFetchRequest(req, res);
  let context = await handler.query(fetchRequest);

  let router = createStaticRouter(
    handler.dataRoutes,
    context
  );
  let html = ReactDOMServer.renderToString(
    <StaticRouterProvider
      router={router}
      context={context}
    />
  );

  res.send("<!DOCTYPE html>" + html);
});
```

<docs-info>We use [`renderToString`][rendertostring] here for simplicity since we've already loaded our data in `handler.query` and we're not using any streaming features in this simple example. If you need to support streaming features, you would need to use [`renderToPipeableStream`][rendertopipeablestream].<br/><br/>If you wish to support [`defer`][defer], you will also need to manage serializing the server-side Promises over the wire to the client (hint, just use [Remix][remix] where this is handled for you via the `Scripts` component 😉).</docs-info>

Once we've sent the HTML back to the browser, we'll need to "hydrate" the application on the client using `createBrowserRouter()` and `<RouterProvider>`:

```jsx filename=entry-client.jsx lines=[10-15]
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { routes } from "./routes";

let router = createBrowserRouter(routes);

ReactDOM.hydrateRoot(
  document.getElementById("app"),
  <RouterProvider router={router} />
);
```

And with that you've got a server-side-rendered and hydrated application! For a working example, you may also refer to the [example][ssr-data-router-example] in the Github repository.

### Additional Concepts

As mentioned above, server-side rendering is tricky at scale and for production-grade applications, and we strongly recommend checking out [Remix][remix] if that's your goal. But if you are going the manual route, here's a few additional concepts you may need to consider:

#### Hydration

A core concept of Server Side Rendering is [hydration][hydration] which involves "attaching" a client-side React application to server-rendered HTML. To do this correctly, we need to create our client-side React Router application in the same state that it was in during the server render. When your server render loaded data via `loader` functions, we need to send this data up so that we can create our client router with the same loader data for the initial render/hydration.

The basic usages of `<StaticRouterProvider>` and `createBrowserRouter` shown in this guide handle this for you internally, but if you need to take control over the hydration process you can disable the automatic hydration process via [`<StaticRouterProvider hydrate={false} />`][hydrate-false].

In some advanced use cases, you may want to partially hydrate a client-side React Router application. You can do this via the [`future.v7_partialHydration`][partialhydration] flag passed to `createBrowserRouter`.

#### Redirects

If any loaders redirect, `handler.query` will return the `Response` directly so you should check that and send a redirect response instead of attempting to render an HTML document:

```js filename=server.jsx lines=[5-10]
app.get("*", async (req, res) => {
  let fetchRequest = createFetchRequest(req, res);
  let context = await handler.query(fetchRequest);

  if (
    context instanceof Response &&
    [301, 302, 303, 307, 308].includes(context.status)
  ) {
    return res.redirect(
      context.status,
      context.headers.get("Location")
    );
  }

  // Render HTML...
});
```

#### Lazy Routes

If you're using [`route.lazy`][lazy] in your routes, then on the client it's possible you have all the data you need to hydrate, but you don't yet have the route definitions! Ideally, your setup would determine the matched routes on the server and deliver their route bundles on the critical path such that you don't use `lazy` on your initially matched routes. However, if this is not the case you'll need to load these routes and update them in place _prior_ to hydrating to avoid the router falling back to a loading state:

```jsx filename=entry-client.jsx
// Determine if any of the initial routes are lazy
let lazyMatches = matchRoutes(
  routes,
  window.location
)?.filter((m) => m.route.lazy);

// Load the lazy matches and update the routes before creating your router
// so we can hydrate the SSR-rendered content synchronously
if (lazyMatches && lazyMatches?.length > 0) {
  await Promise.all(
    lazyMatches.map(async (m) => {
      let routeModule = await m.route.lazy();
      Object.assign(m.route, {
        ...routeModule,
        lazy: undefined,
      });
    })
  );
}

let router = createBrowserRouter(routes);

ReactDOM.hydrateRoot(
  document.getElementById("app"),
  <RouterProvider router={router} fallbackElement={null} />
);
```

See also:

- [`createStaticHandler`][createstatichandler]
- [`createStaticRouter`][createstaticrouter]
- [`<StaticRouterProvider>`][staticrouterprovider]

## Without a Data Router

First you'll need some sort of "app" or "root" component that gets rendered on the server and in the browser:

```js filename=App.js
export default function App() {
  return (
    <html>
      <head>
        <title>Server Rendered App</title>
      </head>
      <body>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/about" element={<div>About</div>} />
        </Routes>
        <script src="/build/client.entry.js" />
      </body>
    </html>
  );
}
```

Here's a simple express server that renders the app on the server. Note the use of `StaticRouter`.

```js filename=server.entry.js
import express from "express";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";

let app = express();

app.get("*", (req, res) => {
  let html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
  );
  res.send("<!DOCTYPE html>" + html);
});

app.listen(3000);
```

<docs-info>We use [`renderToString`][rendertostring] here for simplicity since we're not using any streaming features in this simple example. If you need to support streaming features, you would need to use [`renderToPipeableStream`][rendertopipeablestream].</docs-info>

And finally, you'll need a similar file to "hydrate" the app with your JavaScript bundle that includes the very same `App` component. Note the use of `BrowserRouter` instead of `StaticRouter`.

```js filename=client.entry.js
import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.hydrate(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.documentElement
);
```

The only real differences from the client entry are:

- `StaticRouter` instead of `BrowserRouter`
- passing the URL from the server to `<StaticRouter url>`
- Using `ReactDOMServer.renderToString` instead of `ReactDOM.render`.

Some parts you'll need to do yourself for this to work:

- How to bundle the code to work in the browser and server
- How to know where the client entry is for `<script>` in the `<App>` component.
- Figuring out data loading (especially for the `<title>`).

Again, we recommend you give [Remix](https://remix.run) a look. It's the best way to server render a React Router app--and perhaps the best way to build any React app 😉.

[remix]: https://remix.run
[picking-a-router]: ../routers/picking-a-router
[ssr-non-data]: #without-a-data-router
[ssr-data-router-example]: https://github.com/remix-run/react-router/tree/main/examples/ssr-data-router
[createstatichandler]: ../routers/create-static-handler
[createstaticrouter]: ../routers/create-static-router
[staticrouterprovider]: ../routers/static-router-provider
[lazy]: ../route/lazy
[hydration]: https://react.dev/reference/react-dom/client/hydrateRoot
[hydrate-false]: ../routers/static-router-provider#hydrate
[partialhydration]: ../routers/create-browser-router#partial-hydration-data
[rendertostring]: https://react.dev/reference/react-dom/server/renderToString
[rendertopipeablestream]: https://react.dev/reference/react-dom/server/renderToPipeableStream
[defer]: https://reactrouter.com/en/main/utils/defer
