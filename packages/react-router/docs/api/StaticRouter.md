# &lt;StaticRouter>

A [`<Router>`](Router.md) that never changes location.

This can be useful in server-side rendering scenarios when the user isn't actually clicking around, so the location never actually changes. Hence, the name: static. It's also useful in simple tests when you just need to plug in a location and make assertions on the render output.

Here's an example node server that sends a 302 status code for [`<Redirect>`](Redirect.md)s and regular HTML for other requests:

```jsx
import { createServer } from "http";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router";

createServer((req, res) => {
  // This context object contains the results of the render
  const context = {};

  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  );

  // context.url will contain the URL to redirect to if a <Redirect> was used
  if (context.url) {
    res.writeHead(302, {
      Location: context.url
    });
    res.end();
  } else {
    res.write(html);
    res.end();
  }
}).listen(3000);
```

## basename: string

The base URL for all locations. A properly formatted basename should have a leading slash, but no trailing slash.

```jsx
<StaticRouter basename="/calendar">
  <Link to="/today"/> // renders <a href="/calendar/today">
</StaticRouter>
```

## location: string

The URL the server received, probably `req.url` on a node server.

```jsx
<StaticRouter location={req.url}>
  <App />
</StaticRouter>
```

## location: object

A location object shaped like `{ pathname, search, hash, state }`

```jsx
<StaticRouter location={{ pathname: "/bubblegum" }}>
  <App />
</StaticRouter>
```

## context: object

A plain JavaScript object. During the render, components can add properties to the object to store information about the render.

```jsx
const context = {}
<StaticRouter context={context}>
  <App />
</StaticRouter>
```

When a `<Route>` matches, it will pass the context object to the component it renders as the `staticContext` prop. Check out the [Server Rendering guide](../../../react-router-dom/docs/guides/server-rendering.md) for more information on how to do this yourself.

After the render, these properties can be used to to configure the server's response.

```js
if (context.status === "404") {
  // ...
}
```

## children: node

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.
