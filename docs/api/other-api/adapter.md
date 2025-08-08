---
title: "@react-router/{adapter}"
---

# Server Adapters

## Official Adapters

Idiomatic React Router apps can generally be deployed anywhere because React Router adapts the server's request/response to the [Web Fetch API][web-fetch-api]. It does this through adapters. We maintain a few adapters:

- `@react-router/architect`
- `@react-router/cloudflare`
- `@react-router/express`

These adapters are imported into your server's entry and are not used inside your React Router app itself.

If you initialized your app with `npx create-react-router@latest` with something other than the built-in [React Router App Server][rr-serve] (`@react-router/serve`), you will note a `server/index.js` file that imports and uses one of these adapters.

<docs-info>If you're using the built-in React Router App Server, you don't interact with this API</docs-info>

Each adapter has the same API. In the future we may have helpers specific to the platform you're deploying to.

## `@react-router/express`

Here's a simple example with Express:

```tsx
import express from "express";

const BUILD_PATH = "./build/server/index.js";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(express.static("build/client", { maxAge: "1h" }));
app.use(await import(BUILD_PATH).then((mod) => mod.app));

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`,
  );
});
```

### Migrating from the React Router App Server

If you started an app with the [React Router App Server][rr-serve] but find that you want to take control over the Express server and customize it, it should be fairly straightforward to migrate way from `@react-router/serve`.

You can refer to the [Express template][express-template] as a reference, gut here's the main changes you should have to make:

**1. Update deps**

```sh
npm uninstall @react-router/serve
npm install @react-router/express compression express morgan cross-env
npm install --save-dev @types/express @types/express-serve-static-core @types/morgan
```

**2. Add a server**

Create your React Router express server in `server/app.ts`:

```ts filename=server/app.ts
import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";

export const app = express();

app.use(
  createRequestHandler({
    build: () =>
      import("virtual:react-router/server-build"),
  }),
);
```

Copy the [`server.js`][express-template-server-js] into your app. This is the boilerplate setup we recommend to allow the same server code to run both the development and production builds of your app. Two separate files are used here so that the main Express server code can be written in TypeScript (`server/app.ts`) and compiled into your server build by React Router, and then executed via `node server.js`.

**3. Update `vite.config.ts` to compile the server**

```tsx filename=vite.config.ts lines=[6-10]
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? { input: "./server/app.ts" }
      : undefined,
  },
  plugins: [reactRouter(), tsconfigPaths()],
}));
```

**4. Update `package.json` scripts**

Update the `dev` and `start` scripts to use your new Express server:

```json filename=package.json
{
  // ...
  "scripts": {
    "dev": "cross-env NODE_ENV=development node server.js",
    "start": "node server.js"
    // ...
  }
  // ...
}
```

## `@react-router/architect`

Here's an example with Architect (AWS):

```ts
const {
  createRequestHandler,
} = require("@react-router/architect");
exports.handler = createRequestHandler({
  build: require("./build"),
});
```

## `@react-router/cloudflare`

Here's an example with the simplified Cloudflare Workers API:

```ts
import { createEventHandler } from "@react-router/cloudflare-workers";

import * as build from "../build";

addEventListener("fetch", createEventHandler({ build }));
```

<!-- TODO: We used to have a Community Adapters section here, but unsure which of those are RR friendly so we should check that before re-including? -->

## Creating an Adapter

### `createRequestHandler`

Creates a request handler for your server to serve the app. This is the ultimate entry point of your React Router application.

```ts
const {
  createRequestHandler,
} = require("@react-router/{adapter}");
createRequestHandler({ build, getLoadContext });
```

Here's a full example with express:

```ts lines=[1-3,11-22]
const {
  createRequestHandler,
} = require("@react-router/express");
const express = require("express");

const app = express();

// needs to handle all verbs (GET, POST, etc.)
app.all(
  "*",
  createRequestHandler({
    // `react-router build` and `react-router dev` output files to a build directory,
    // you need to pass that build to the request handler
    build: require("./build"),

    // Return anything you want here to be available as `context` in your
    // loaders and actions. This is where you can bridge the gap between your
    // server and React Router
    getLoadContext(req, res) {
      return {};
    },
  }),
);
```

[web-fetch-api]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[rr-serve]: ./serve
[express-template]: https://github.com/remix-run/react-router-templates/tree/main/node-custom-server
[express-template-server-js]: https://github.com/remix-run/react-router-templates/blob/main/node-custom-server/server.js
