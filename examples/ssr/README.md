# Server Side Rendering Example

This example takes our basic example and adds Server Side Rendering to it.

In this example we provide a simple production ready server that renders the application.

We have two entry points in this example, one for the client (src/entry.client.tsx) and one for the server (src/entry.server.tsx). On the client, we use React Router like we would traditionally do in a client app. On the server, we use React Router's `StaticRouter` to render the app, and then the client rehydrates the app.

## Preview

Open this example on [StackBlitz](https://stackblitz.com):

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router/tree/dev/examples/ssr?file=src/app.tsx)
