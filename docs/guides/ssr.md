---
title: Server Rendering
---

The most basic server rendering in React Router is pretty straightforward.

However, there's a lot more to consider than just getting the right routes to render. Here's an incomplete list of things you'll need to consider:

- Bundling your code for the server and the browser
- Not bundling server-only code into the browser bundles
- Server Side data loading so you actually have something to render
- Data loading strategies that work on the client and server
- Handling code splitting in the server and client
- Proper HTTP status codes and redirects
- Deployment

Setting all of this up well can be really difficult.

If you want to server render your React Router app, we highly recommend you use [Remix](https://remix.run). This is another project of ours. It's built on top of React Router and handles all of the things mentioned above and more. Give it a shot!

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

Here's the browser entry point (you've already seen this kind of code in this tutorial):

```js filename=client.entry.js
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.documentElement
);
```

And finally, here's a simple express server that renders the same thing.

```js filename=server.entry.js
import express from "express"
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";

let app = express();

app.get("*", ((req, res)) => {
  let html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App/>
    </StaticRouter>
  );
  res.send("<!DOCTYPE html>" + html);
})

app.listen(3000);
```

The only real differences from the client entry are:

- `StaticRouter` instead of `BrowserRouter`
- passing the URL from the server to `<StaticRouter url>`
- Using `ReactDOMServer.renderToString` instead of `ReactDOM.render`.

Some parts you'll need to fill for this to work:

- How to bundle the code to work in the browser and server
- How to know where the client entry is for `<script>` in the `<App>` component.
- Figuring out data loading (especially for the `<title>`).

Again, we recommend you give [Remix](https://remix.run) a look.
