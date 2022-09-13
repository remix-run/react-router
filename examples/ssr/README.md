---
title: Server Rendering
toc: false
---

# Server-side Rendering Example

This example adds [server-side rendering](https://reactjs.org/docs/react-dom-server.html) (SSR) to our basic example.

With SSR, the server renders your app and sends real HTML to the browser instead of an empty HTML document with a bunch of `<script>` tags. After the browser loads the HTML and JavaScript from the server, React "hydrates" the HTML document using the same components it used to render the app on the server.

This example contains a server (see [server.js](server.js)) that can run in both development and production modes.

In the browser entry point (see [src/entry.client.tsx](src/entry.client.tsx)), we use React Router like we would traditionally do in a purely client-side app and render a `<BrowserRouter>` to provide routing context to the rest of the app. The main difference is that instead of using `ReactDOM.createRoot(el).render()` to render the app, since the HTML was already sent by the server, all we need is `ReactDOM.hydrateRoot()`.

On the server (see [src/entry.server.tsx](src/entry.server.tsx)), we use React Router's `<StaticRouter>` to render the app and plug in the URL we get from the incoming HTTP request.

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/main/examples/ssr?file=src/App.tsx)
