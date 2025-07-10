---
title: React Server Components (unstable)
unstable: true
---

# React Server Components

[MODES: data]

<br/>
<br/>

<docs-warning>React Server Components support is experimental and subject to breaking changes.</docs-warning>

React Server Components (RSC) refers generally to an architecture and set of APIs provided by React since version 19.

From the docs:

> Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server.
> <cite>- [React "Server Components" docs][react-server-components-doc]</cite>

React Router provides a set of APIs for integrating with RSC-native bundlers, allowing you to leverage [Server Components][react-server-components-doc] and [Server Functions][react-server-functions-doc] in your React Router applications.

## Quick Start

The quickest way to get started is with one of our templates.

These templates come with React Router RSC APIs already configured with the respective bundler, offering you out of the box features such as:

- Server Components Routes
- Server Side Rendering (SSR)
- Client Components (via [`"use client"`][use-client-docs] directive)
- Server Functions (via [`"use server"`][use-server-docs] directive)

**Parcel Template**

```shellscript
npx create-react-router-app@latest --template=unstable_rsc-parcel
```

**Vite Template**

```shellscript
npx create-react-router-app@latest --template=unstable_rsc-vite
```

## Using RSC with React Router

### Configuring Routes

Routes are configured as an argument to [`matchRSCServerRequest`][match-rsc-server-request]. At a minimum, you need a path and component:

```tsx
function Root() {
  return <h1>Hello world</h1>;
}

matchRSCServerRequest({
  // ...other options
  routes: [{ path: "/", Component: Root }],
});
```

While you can define components inline, we recommend for both startup performance, as well as code organization, using the `lazy()` option and defining [Route Modules][route-module]

<docs-info>

The [Route Modules][route-module] up until now were a [Framework Mode][framework-mode] only feature. However, the `lazy` field of the RSC route config expects the same exports as the Route Module exports, unifying the APIs even further.

</docs-info>

```tsx filename=app/routes.ts
import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

export function routes() {
  return [
    {
      id: "root",
      path: "",
      lazy: () => import("./root/route"),
      children: [
        {
          id: "home",
          index: true,
          lazy: () => import("./home/route"),
        },
        {
          id: "about",
          path: "about",
          lazy: () => import("./about/route"),
        },
      ],
    },
  ] satisfies RSCRouteConfig;
}
```

### Server Component Routes

By default each route's `default` export renders a Server Component

```tsx
export default function Home() {
  return (
    <main>
      <article>
        <h1>Welcome to React Router RSC</h1>
        <p>
          You won't find me running any JavaScript in the
          browser!
        </p>
      </article>
    </main>
  );
}
```

A nice feature of Server Components is you can fetch data directly from your component by making it asynchronous.

```tsx
export default async function Home() {
  let user = await getUserData();

  return (
    <main>
      <article>
        <h1>Welcome to React Router RSC</h1>
        <p>
          You won't find me running any JavaScript in the
          browser!
        </p>
        <p>
          Hello, {user ? user.name : "anonymous person"}!
        </p>
      </article>
    </main>
  );
}
```

<docs-info>

Server Components can also be returned from your `loader`s and `action`s. In general if you are using RSC to build your application, `loader`s are primarily useful for things like setting `status` codes or return `redirect`s.

Using Server Components in `loader`s can be helpful for incremental adoption of RSC.

</docs-info>

### Server Functions

[Server Functions][react-server-functions-doc] are a React feature that allow you to call async functions executed on the server. They're defined with the [`"use server"`][use-server-docs] directive.

```tsx
"use server";

export async function updateFavorite(formData: FormData) {
  let movieId = formData.get("id");
  let intent = formData.get("intent");
  if (intent === "add") {
    await addFavorite(Number(movieId));
  } else {
    await removeFavorite(Number(movieId));
  }
}
import { updateFavorite } from "./action.ts";
```

```tsx
export async function AddToFavoritesForm({
  movieId,
}: {
  movieId: number;
}) {
  let isFav = await isFavorite(movieId);
  return (
    <form action={updateFavorite}>
      <input type="hidden" name="id" value={movieId} />
      <input
        type="hidden"
        name="intent"
        value={liked ? "remove" : "add"}
      />
      <AddToFavoritesButton isFav={isFav} />
    </form>
  );
}
```

Note that after server functions are called, React Router will automatically revalidate the route and update the UI with the new server content. You don't have to mess around with any cache invalidation.

### Client Properties

Routes are defined on the server at runtime, but we can still provide `clientLoader`, `clientAction`, and `shouldRevalidate` through the utilization of client references and `"use client"`.

```tsx filename=src/routes/root/client.tsx
"use client";

export function clientAction() {}

export function clientLoader() {}

export function shouldRevalidate() {}
```

We can then re-export these from our lazy loaded route module:

```tsx filename=src/routes/root/route.tsx
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
} from "./route.client";

export default function Root() {
  // ...
}
```

This is also the way we would make an entire route a Client Component.

```tsx filename=src/routes/root/route.tsx lines=[6,11]
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
  default as ClientRoot,
} from "./route.client";

export default function Root() {
  // Adding a Server Component at the root is required by bundlers
  // if you're using css side-effects imports.
  return <ClientRoot />;
}
```

## Configuring RSC with React Router

React Router provides several APIs that allow you to easily integrate with RSC-native bundlers, useful if you are using React Router data mode to make your own [custom framework][custom-framework].

### Entry points

React Server Components require 3 things:

1. A server to handle the request and convert the RSC payload into HTML
2. A React server to generate RSC payloads
3. A client handler to hydrate the generated HTML and set the `callServer` function to support post-hydration server actions

The following naming conventions have been chosen for familiarity and simplicity. Feel free to name and configure your entry points as you see fit.

See the relevant bundler documentation below for specific code examples for each of the following entry points.

These examples all use [express][express] and [@mjackson/node-fetch-server][node-fetch-server] for the server and request handling.

**Server**

<docs-info>

You don't have to use SSR at all. You can choose to use RSC to "prerender" HTML for Static Site Generation (SSG) or something like Incremental Static Regeneration (ISR).

</docs-info>

`entry.ssr.tsx` is the entry point for the sever. It is responsible for handling the request, calling the RSC server, and converting the RSC payload into HTML on document requests (server-side rendering).

Relevant APIs:

- [`routeRSCServerRequest`][route-rsc-server-request]
- [`RSCStaticRouter`][rsc-static-router]

**RSC Server**

<docs-info>

Even though you have a "React Server" and a serve responsible for request handling/SSR, you don't actually have to have 2 separate servers. You can simply have 2 separate module graphs within the same server. This is important because React is different when generating RSC payloads vs. when generating HTML to be hydrated on the client.

</docs-info>

`entry.rsc.tsx` is the entry point for the React Server. It is responsible for matching the request to a route and generating RSC payloads.

Relevant APIs:

- [`matchRSCServerRequest`][match-rsc-server-request]

**Client**

`entry.client.tsx` is the entry point for the client. It is responsible for hydrating the generated HTML and setting the `callServer` function to support post-hydration server actions.

Relevant APIs:

- [`createCallServer`][create-call-server]
- [`getRSCStream`][get-rsc-stream]
- [`RSCHydratedRouter`][rsc-hydrated-router]

### Parcel

See the [Parcel RSC docs][parcel-rsc-doc] for more information.

In addition to `react`, `react-dom`, and `react-router`, you'll need the following dependencies:

```shellscript
# install runtime dependencies
npm i @parcel/runtime-rsc react-server-dom-parcel

# install dev dependencies
npm i -D parcel
```

#### `package.json`

To configure Parcel, add the following to your `package.json`:

```json filename=package.json
{
  "scripts": {
    "build": "parcel build --no-autoinstall",
    "dev": "cross-env NODE_ENV=development parcel --no-autoinstall --no-cache",
    "start": "cross-env NODE_ENV=production node dist/server/entry.rsc.js"
  },
  "targets": {
    "react-server": {
      "context": "react-server",
      "source": "src/entry.rsc.tsx",
      "scopeHoist": false,
      "includeNodeModules": {
        "@mjackson/node-fetch-server": false,
        "compression": false,
        "express": false
      }
    }
  }
}
```

#### `routes/config.ts`

You must add `"use server-entry"` to the top of the file to the file where you define your routes. Additionally, you need to import the client entry point, since it will use the `"use client-entry"` directive (see below).

```tsx filename=src/routes/config.ts
"use server-entry";

import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

import "../entry.client";

export function routes() {
  return [
    {
      id: "root",
      path: "",
      lazy: () => import("./root/route"),
      children: [
        {
          id: "home",
          index: true,
          lazy: () => import("./home/route"),
        },
        {
          id: "about",
          path: "about",
          lazy: () => import("./about/route"),
        },
      ],
    },
  ] satisfies RSCRouteConfig;
}
```

#### `entry.ssr.tsx`

The following is a simplified example of a Parcel SSR Server.

```tsx filename=src/entry.ssr.tsx
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
import { createFromReadableStream } from "react-server-dom-parcel/client.edge";

export async function generateHTML(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>,
  bootstrapScriptContent: string | undefined
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to call the React Server.
    fetchServer,
    // Provide the React Server touchpoints.
    createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = await getPayload();
      const formState =
        payload.type === "render"
          ? await payload.formState
          : undefined;

      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          formState,
        }
      );
    },
  });
}
```

#### `entry.rsc.tsx`

The following is a simplified example of a Parcel RSC Server.

```tsx filename=src/entry.rsc.tsx
import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "react-server-dom-parcel/server.edge";

// Import the generateHTML function from the client environment
import { generateHTML } from "./entry.ssr" with { env: "react-client" };
import { routes } from "./routes/config";

function fetchServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    createTemporaryReferenceSet,
    decodeAction,
    decodeFormState,
    decodeReply,
    loadServerAction,
    // The incoming request.
    request,
    // The app routes.
    routes: routes(),
    // Encode the match with the React Server implementation.
    generateResponse(match) {
      return new Response(renderToReadableStream(match.payload), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

const app = express();

// Serve static assets with compression and long cache lifetime.
app.use(
  "/client",
  compression(),
  express.static("dist/client", {
    immutable: true,
    maxAge: "1y",
  })
);
// Hookup our application.
app.use(
  createRequestListener((request) =>
    generateHTML(
      request,
      fetchServer,
      (routes as unknown as { bootstrapScript?: string }).bootstrapScript
    )
  )
);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

#### `entry.client.tsx`

```tsx filename=src/entry.client.tsx
"use client-entry";

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
  type unstable_RSCPayload as RSCServerPayload,
} from "react-router";
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "react-server-dom-parcel/client";

// Create and set the callServer function to support post-hydration server actions.
setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  })
);

// Get and decode the initial server payload
createFromReadableStream(getRSCStream()).then(
  (payload: RSCServerPayload) => {
    startTransition(async () => {
      const formState =
        payload.type === "render"
          ? await payload.formState
          : undefined;

      hydrateRoot(
        document,
        <StrictMode>
          <RSCHydratedRouter
            createFromReadableStream={
              createFromReadableStream
            }
            payload={payload}
          />
        </StrictMode>,
        {
          formState,
        }
      );
    });
  }
);
```

### Vite

See the [Vite RSC docs][vite-rsc-doc] for more information.

In addition to `react`, `react-dom`, and `react-router`, you'll need the following dependencies:

```shellscript
npm i -D vite @vitejs/plugin-react @vitejs/plugin-rsc
```

#### `vite.config.ts`

To configure Vite, add the following to your `vite.config.ts`:

```ts filename=vite.config.ts
import rsc from "@vitejs/plugin-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    rsc({
      entries: {
        client: "src/entry.client.tsx",
        rsc: "src/entry.rsc.tsx",
        ssr: "src/entry.ssr.tsx",
      },
    }),
  ],
});
```

#### `entry.ssr.tsx`

The following is a simplified example of a Vite SSR Server.

```tsx filename=src/entry.ssr.tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";

export async function generateHTML(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to call the React Server.
    fetchServer,
    // Provide the React Server touchpoints.
    createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = await getPayload();
      const formState =
        payload.type === "render"
          ? await payload.formState
          : undefined;

      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          formState,
        }
      );
    },
  });
}
```

#### `entry.rsc.tsx`

The following is a simplified example of a Vite RSC Server.

```tsx filename=src/entry.rsc.tsx
import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes/config";

function fetchServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    createTemporaryReferenceSet,
    decodeAction,
    decodeFormState,
    decodeReply,
    loadServerAction,
    // The incoming request.
    request,
    // The app routes.
    routes: routes(),
    // Encode the match with the React Server implementation.
    generateResponse(match) {
      return new Response(
        renderToReadableStream(match.payload),
        {
          status: match.statusCode,
          headers: match.headers,
        }
      );
    },
  });
}

export default async function handler(request: Request) {
  // Import the generateHTML function from the client environment
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");

  return ssr.generateHTML(request, fetchServer);
}
```

#### `entry.client.tsx`

```tsx filename=src/entry.client.tsx
import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  unstable_createCallServer as createCallServer,
  unstable_getRSCStream as getRSCStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
  type unstable_RSCPayload as RSCServerPayload,
} from "react-router";

// Create and set the callServer function to support post-hydration server actions.
setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  })
);

// Get and decode the initial server payload
createFromReadableStream<RSCServerPayload>(
  getRSCStream()
).then((payload) => {
  startTransition(async () => {
    const formState =
      payload.type === "render"
        ? await payload.formState
        : undefined;

    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          createFromReadableStream={
            createFromReadableStream
          }
          payload={payload}
        />
      </StrictMode>,
      {
        formState,
      }
    );
  });
});
```

[react-server-components-doc]: https://react.dev/reference/rsc/server-components
[react-server-functions-doc]: https://react.dev/reference/rsc/server-functions
[use-client-docs]: https://react.dev/reference/rsc/use-client
[use-server-docs]: https://react.dev/reference/rsc/use-server
[route-module]: ../start/framework/route-module
[framework-mode]: ../start/framework/route-module
[custom-framework]: ../start/data/custom
[parcel-rsc-doc]: https://parceljs.org/recipes/rsc/
[vite-rsc-doc]: https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc
[match-rsc-server-request]: ../api/rsc/matchRSCServerRequest
[route-rsc-server-request]: ../api/rsc/routeRSCServerRequest
[rsc-static-router]: ../api/rsc/RSCStaticRouter
[create-call-server]: ../api/rsc/createCallServer
[get-rsc-stream]: ../api/rsc/getRSCStream
[rsc-hydrated-router]: ../api/rsc/RSCHydratedRouter
[express]: https://expressjs.com/
[node-fetch-server]: https://github.com/mjackson/remix-the-web/tree/main/packages/node-fetch-server
