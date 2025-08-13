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

Each adapter has the same API. In the future, we may have helpers specific to the platform you're deploying to.

## `@react-router/express`

[Reference Documentation ↗](https://api.reactrouter.com/v7/modules/_react_router_express.html)

Here's an example with [Express][express]:

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

### Migrating from the React Router App Server

If you started an app with the [React Router App Server][rr-serve] but find that you want to take control over the Express server and customize it, it should be fairly straightforward to migrate way from `@react-router/serve`.

You can refer to the [Express template][express-template] as a reference, but here are the main changes you will need to make:

**1. Update deps**

```shellscript nonumber
npm uninstall @react-router/serve
npm install @react-router/express compression express morgan cross-env
npm install --save-dev @types/express @types/express-serve-static-core @types/morgan
```

**2. Add a server**

Create your React Router Express server in `server/app.ts`:

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

## `@react-router/cloudflare`

[Reference Documentation ↗](https://api.reactrouter.com/v7/modules/_react_router_cloudflare.html)

Here's an example with Cloudflare:

```ts
import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
```

## `@react-router/node`

While not a direct "adapter" like the above, this package contains utilities for working with Node-based adapters.

[Reference Documentation ↗](https://api.reactrouter.com/v7/modules/_react_router_node.html)

### Node Version Support

React Router officially supports **Active** and **Maintenance** [Node LTS versions][node-releases] at any given point in time. Dropped support for End of Life Node versions is done in a React Router Minor release.

[express]: https://expressjs.com
[node-releases]: https://nodejs.org/en/about/previous-releases
[web-fetch-api]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[rr-serve]: ./serve
[express-template]: https://github.com/remix-run/react-router-templates/tree/main/node-custom-server
[express-template-server-js]: https://github.com/remix-run/react-router-templates/blob/main/node-custom-server/server.js
