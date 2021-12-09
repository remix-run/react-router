---
title: Server-Side Rendering
toc: false
order: 6
---

# Server-Side Rendering

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

If you want to server render your React Router app, we highly recommend you use [Remix](https://remix.run). This is another project of ours that's built on top of React Router and handles all of the things mentioned above and more. Give it a shot!

If you want to tackle it on your own, you'll need to use `<StaticRouter>` on the server.

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

And finally, you'll need a similar file to "hydrate" the app with your JavaScript bundle that includes the very same `App` component. Note the use of `BrowserRouter` instead of `StaticRouter`.

```js filename=client.entry.js
import ReactDOM from "react-dom";
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
