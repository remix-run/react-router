---
title: React Server Components
unstable: true
---

# React Server Components

[MODES: framework, data]

<br/>
<br/>

<docs-warning>React Server Components support is experimental and subject to breaking changes in
minor/patch releases. Please use with caution and pay **very** close attention
to release notes for relevant changes.</docs-warning>

React Server Components (RSC) refers generally to an architecture and set of APIs provided by React since version 19.

From the docs:

> Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server.
>
> <cite>- [React "Server Components" docs][react-server-components-doc]</cite>

React Router provides a set of APIs for integrating with RSC-compatible bundlers, allowing you to leverage [Server Components][react-server-components-doc] and [Server Functions][react-server-functions-doc] in your React Router applications.

If you're unfamiliar with these React features, we recommend reading the official [Server Components documentation][react-server-components-doc] before using React Router's RSC APIs.

RSC support is available in both Framework and Data Modes. For more information on the conceptual difference between these, see ["Picking a Mode"][picking-a-mode]. However, note that the APIs and features differ between RSC and non-RSC modes in ways that this guide will cover in more detail.

## Quick Start

The quickest way to get started is with one of our templates.

These templates come with React Router RSC APIs already configured, offering you out of the box features such as:

- Server Component Routes
- Server Side Rendering (SSR)
- Client Components (via [`"use client"`][use-client-docs] directive)
- Server Functions (via [`"use server"`][use-server-docs] directive)

### RSC Framework Mode Template

The [RSC Framework Mode template][framework-rsc-template] uses the unstable React Router RSC Vite plugin along with the experimental [`@vitejs/plugin-rsc` plugin][vite-plugin-rsc].

```shellscript
npx create-react-router@latest --template remix-run/react-router-templates/unstable_rsc-framework-mode
```

### RSC Data Mode Templates

The [Vite RSC Data Mode template][vite-rsc-template] uses the experimental Vite `@vitejs/plugin-rsc` plugin.

```shellscript
npx create-react-router@latest --template remix-run/react-router-templates/unstable_rsc-data-mode-vite
```

## RSC Framework Mode

Most APIs and features in RSC Framework Mode are the same as non-RSC Framework Mode, so this guide will focus on the differences.

### New React Router RSC Vite Plugin

RSC Framework Mode uses a different Vite plugin than non-RSC Framework Mode, currently exported as `unstable_reactRouterRSC`.

This new Vite plugin also has a peer dependency on the experimental `@vitejs/plugin-rsc` plugin. Note that the `@vitejs/plugin-rsc` plugin should be placed after the React Router RSC plugin in your Vite config.

```tsx filename=vite.config.ts
import { defineConfig } from "vite";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  plugins: [reactRouterRSC(), rsc()],
});
```

### Build Output

The RSC Framework Mode server build file (`build/server/index.js`) now exports a `default` request handler function (`(request: Request) => Promise<Response>`) for document/data requests.

If needed, you can convert this into a [standard Node.js request listener][node-request-listener] for use with Node's built-in `http.createServer` function (or anything that supports it, e.g. [Express][express]) by using the `createRequestListener` function from [@remix-run/node-fetch-server][node-fetch-server].

For example, in Express:

```tsx filename=start.js
import express from "express";
import requestHandler from "./build/server/index.js";
import { createRequestListener } from "@remix-run/node-fetch-server";

const app = express();

app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(express.static("build/client"));
app.use(createRequestListener(requestHandler));
app.listen(3000);
```

### React Elements From Loaders/Actions

In RSC Framework Mode, loaders and actions can now return React elements along with other data. These elements will only ever be rendered on the server.

```tsx
import type { Route } from "./+types/route";

export async function loader() {
  return {
    message: "Message from the server!",
    element: <p>Element from the server!</p>,
  };
}

export default function Route({
  loaderData,
}: Route.ComponentProps) {
  return (
    <>
      <h1>{loaderData.message}</h1>
      {loaderData.element}
    </>
  );
}
```

If you need to use client-only features (e.g. [Hooks][hooks], event handlers) within React elements returned from loaders/actions, you'll need to extract components using these features into a [client module][use-client-docs]:

```tsx filename=src/routes/counter/counter.tsx
"use client";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

```tsx filename=src/routes/counter/route.tsx
import type { Route } from "./+types/route";
import { Counter } from "./counter";

export async function loader() {
  return {
    message: "Message from the server!",
    element: (
      <>
        <p>Element from the server!</p>
        <Counter />
      </>
    ),
  };
}

export default function Route({
  loaderData,
}: Route.ComponentProps) {
  return (
    <>
      <h1>{loaderData.message}</h1>
      {loaderData.element}
    </>
  );
}
```

### Server Component Routes

If a route exports a `ServerComponent` instead of the typical `default` component export, this component along with other route components (`ErrorBoundary`, `HydrateFallback`, `Layout`) will be server components rather than the usual client components.

```tsx
import type { Route } from "./+types/route";
import { Outlet } from "react-router";
import { getMessage } from "./message";

export async function loader() {
  return {
    message: await getMessage(),
  };
}

export function ServerComponent({
  loaderData,
}: Route.ComponentProps) {
  return (
    <>
      <h1>Server Component Route</h1>
      <p>Message from the server: {loaderData.message}</p>
      <Outlet />
    </>
  );
}
```

If you need to use client-only features (e.g. [Hooks][hooks], event handlers) within a server-first route, you'll need to extract components using these features into a [client module][use-client-docs]:

```tsx filename=src/routes/counter/counter.tsx
"use client";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

```tsx filename=src/routes/counter/route.tsx
import { Counter } from "./counter";

export function ServerComponent() {
  return (
    <>
      <h1>Counter</h1>
      <Counter />
    </>
  );
}
```

### `.server`/`.client` Modules

To avoid confusion with RSC's `"use server"` and `"use client"` directives, support for [`.server` modules][server-modules] and [`.client` modules][client-modules] is no longer built-in when using RSC Framework Mode.

As an alternative solution that doesn't rely on file naming conventions, we recommend using the `"server-only"` and `"client-only"` imports provided by [`@vitejs/plugin-rsc`][vite-plugin-rsc]. For example, to ensure a module is never accidentally included in the client build, simply import from `"server-only"` as a side effect within your server-only module.

```ts filename=app/utils/db.ts
import "server-only";

// Rest of the module...
```

Note that while there are official npm packages [`server-only`][server-only-package] and [`client-only`][client-only-package] created by the React team, they don't need to be installed. `@vitejs/plugin-rsc` internally handles these imports and provides build-time validation instead of runtime errors.

If you'd like to quickly migrate existing code that relies on the `.server` and `.client` file naming conventions, we recommend using the [`vite-env-only` plugin][vite-env-only] directly. For example, to ensure `.server` modules aren't accidentally included in the client build:

```tsx filename=vite.config.ts
import { defineConfig } from "vite";
import { denyImports } from "vite-env-only";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  plugins: [
    denyImports({
      client: { files: ["**/.server/*", "**/*.server.*"] },
    }),
    reactRouterRSC(),
    rsc(),
  ],
});
```

### MDX Route Support

MDX routes are supported in RSC Framework Mode when using `@mdx-js/rollup` v3.1.1+.

Note that any components exported from an MDX route must also be valid in RSC environments, meaning that they cannot use client-only features like [Hooks][hooks]. Any components that need to use these features should be extracted into a [client module][use-client-docs].

### Custom Entry Files

RSC Framework Mode supports custom entry files, allowing you to customize the behavior of the RSC server, SSR server, and client entry points.

The plugin will automatically detect custom entry files in your `app` directory:

- `app/entry.rsc.ts` (or `.tsx`) - Custom RSC server entry
- `app/entry.ssr.ts` (or `.tsx`) - Custom SSR server entry
- `app/entry.client.tsx` - Custom client entry

If these files are not found, React Router will use the default entries provided by the framework.

#### Basic Override Pattern

You can create a custom entry file that wraps or extends the default behavior. For example, to add custom logging to the RSC entry:

```ts filename=app/entry.rsc.ts
import defaultEntry from "@react-router/dev/config/default-rsc-entries/entry.rsc";
import { RouterContextProvider } from "react-router";

export default {
  fetch(request: Request): Promise<Response> {
    console.log(
      "Custom RSC entry handling request:",
      request.url,
    );

    const requestContext = new RouterContextProvider();

    return defaultEntry.fetch(request, requestContext);
  },
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
```

Similarly, you can customize the SSR entry:

```ts filename=app/entry.ssr.ts
import { generateHTML as defaultGenerateHTML } from "@react-router/dev/config/default-rsc-entries/entry.ssr";

export function generateHTML(
  request: Request,
  serverResponse: Response,
): Promise<Response> {
  console.log(
    "Custom SSR entry generating HTML for:",
    request.url,
  );

  return defaultGenerateHTML(request, serverResponse);
}
```

And for the client:

```ts filename=app/entry.client.ts
import "@react-router/dev/config/default-rsc-entries/entry.client";
```

#### Copying Default Entries

For more advanced customization, you can copy the default entries and modify them as needed. To find the default entries:

1. In your IDE, use "Go to Definition" (or Cmd/Ctrl+Click) on the default entry import:

   ```ts
   import defaultEntry from "@react-router/dev/config/default-rsc-entries/entry.rsc";
   ```

2. Copy the default entry code into your custom file

3. Modify it to suit your needs

The default entries are located at:

- [`@react-router/dev/config/default-rsc-entries/entry.rsc`][entry-rsc-source]
- [`@react-router/dev/config/default-rsc-entries/entry.ssr`][entry-ssr-source]
- [`@react-router/dev/config/default-rsc-entries/entry.client`][entry-client-source]

You can view the source code on GitHub using the links above, or navigate directly to these files in `node_modules/@react-router/dev/dist/config/default-rsc-entries/`.

<docs-info>

When copying default entries, make sure to maintain the required exports:

- `entry.rsc.ts` must export a default object with a `fetch` method
- `entry.ssr.ts` must export a `generateHTML` function
- `entry.client.tsx` should handle client-side hydration

</docs-info>

### Unsupported Config Options

For the initial unstable release, the following options from `react-router.config.ts` are not yet supported in RSC Framework Mode:

- `buildEnd`
- `prerender`
- `presets`
- `routeDiscovery`
- `serverBundles`
- `ssr: false` (SPA Mode)
- `future.v8_splitRouteModules`
- `future.unstable_subResourceIntegrity`

## RSC Data Mode

The RSC Framework Mode APIs described above are built on top of lower-level RSC Data Mode APIs.

RSC Data Mode is missing some of the features of RSC Framework Mode (e.g. `routes.ts` config and file system routing, HMR and Hot Data Revalidation), but is more flexible and allows you to integrate with your own bundler and server abstractions.

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

While you can define components inline, we recommend using the `lazy()` option and defining [Route Modules][route-module] for both startup performance and code organization

<docs-info>

The [Route Module API][route-module] up until now has been a [Framework Mode][framework-mode] only feature. However, the `lazy` field of the RSC route config expects the same exports as the Route Module exports, unifying the APIs even further.

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

A nice feature of Server Components is that you can fetch data directly from your component by making it asynchronous.

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

Server Components can also be returned from your loaders and actions. In general, if you are using RSC to build your application, loaders are primarily useful for things like setting `status` codes or returning a `redirect`.

Using Server Components in loaders can be helpful for incremental adoption of RSC.

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
```

```tsx
import { updateFavorite } from "./action.ts";
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
        value={isFav ? "remove" : "add"}
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

```tsx filename=src/routes/root/route.tsx lines=[1,11]
import { default as ClientRoot } from "./route.client";
export {
  clientAction,
  clientLoader,
  shouldRevalidate,
} from "./route.client";

export default function Root() {
  // Adding a Server Component at the root is required by bundlers
  // if you're using css side-effects imports.
  return <ClientRoot />;
}
```

### Bundler Configuration

React Router provides several APIs that allow you to easily integrate with RSC-compatible bundlers, useful if you are using React Router Data Mode to make your own [custom framework][custom-framework].

The following steps show how to setup a React Router application to use Server Components (RSC) to server-render (SSR) pages and hydrate them for single-page app (SPA) navigations. You don't have to use SSR (or even client-side hydration) if you don't want to. You can also leverage the HTML generation for Static Site Generation (SSG) or Incremental Static Regeneration (ISR) if you prefer. This guide is meant merely to explain how to wire up all the different APIs for a typically RSC-based application.

### Entry points

Besides our [route definitions](#configuring-routes), we will need to configure the following:

1. A server to handle the incoming request, fetch the RSC payload, and convert it into HTML
2. A React server to generate RSC payloads
3. A browser handler to hydrate the generated HTML and set the `callServer` function to support post-hydration server actions

The following naming conventions have been chosen for familiarity and simplicity. Feel free to name and configure your entry points as you see fit.

See the relevant bundler documentation below for specific code examples for each of the following entry points.

These examples all use [express][express] and [@remix-run/node-fetch-server][node-fetch-server] for the server and request handling.

**Routes**

See [Configuring Routes](#configuring-routes).

**Server**

<docs-info>

You don't have to use SSR at all. You can choose to use RSC to "prerender" HTML for Static Site Generation (SSG) or something like Incremental Static Regeneration (ISR).

</docs-info>

`entry.ssr.tsx` is the entry point for the server. It is responsible for handling the request, calling the RSC server, and converting the RSC payload into HTML on document requests (server-side rendering).

Relevant APIs:

- [`routeRSCServerRequest`][route-rsc-server-request]
- [`RSCStaticRouter`][rsc-static-router]

**RSC Server**

<docs-info>

Even though you have a "React Server" and a server responsible for request handling/SSR, you don't actually need to have 2 separate servers. You can simply have 2 separate module graphs within the same server. This is important because React behaves differently when generating RSC payloads vs. when generating HTML to be hydrated on the client.

</docs-info>

`entry.rsc.tsx` is the entry point for the React Server. It is responsible for matching the request to a route and generating RSC payloads.

Relevant APIs:

- [`matchRSCServerRequest`][match-rsc-server-request]

**Browser**

`entry.browser.tsx` is the entry point for the client. It is responsible for hydrating the generated HTML and setting the `callServer` function to support post-hydration server actions.

Relevant APIs:

- [`createCallServer`][create-call-server]
- [`getRSCStream`][get-rsc-stream]
- [`RSCHydratedRouter`][rsc-hydrated-router]

### Vite

See the [@vitejs/plugin-rsc docs][vite-plugin-rsc] for more information. You can also refer to our [Vite RSC Data Mode template][vite-rsc-template] to see a working version.

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
        client: "src/entry.browser.tsx",
        rsc: "src/entry.rsc.tsx",
        ssr: "src/entry.ssr.tsx",
      },
    }),
  ],
});
```

```tsx filename=src/routes/config.ts
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

#### `entry.ssr.tsx`

The following is a simplified example of a Vite SSR Server.

```tsx filename=src/entry.ssr.tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";

export async function generateHTML(
  request: Request,
  serverResponse: Response,
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // The React Server response
    serverResponse,
    // Provide the React Server touchpoints.
    createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = getPayload();

      const bootstrapScriptContent =
        await import.meta.viteRsc.loadBootstrapScriptContent(
          "index",
        );

      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          formState: payload.formState,
        },
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
        },
      );
    },
  });
}

export default async function handler(request: Request) {
  // Import the generateHTML function from the client environment
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");

  return ssr.generateHTML(
    request,
    await fetchServer(request),
  );
}
```

#### `entry.browser.tsx`

```tsx filename=src/entry.browser.tsx
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
  }),
);

// Get and decode the initial server payload.
createFromReadableStream<RSCServerPayload>(
  getRSCStream(),
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
      },
    );
  });
});
```

[picking-a-mode]: ../start/modes
[react-server-components-doc]: https://react.dev/reference/rsc/server-components
[react-server-functions-doc]: https://react.dev/reference/rsc/server-functions
[use-client-docs]: https://react.dev/reference/rsc/use-client
[use-server-docs]: https://react.dev/reference/rsc/use-server
[route-module]: ../start/framework/route-module
[framework-mode]: ../start/modes#framework
[custom-framework]: ../start/data/custom
[vite-plugin-rsc]: https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc
[match-rsc-server-request]: ../api/rsc/matchRSCServerRequest
[route-rsc-server-request]: ../api/rsc/routeRSCServerRequest
[rsc-static-router]: ../api/rsc/RSCStaticRouter
[create-call-server]: ../api/rsc/createCallServer
[get-rsc-stream]: ../api/rsc/getRSCStream
[rsc-hydrated-router]: ../api/rsc/RSCHydratedRouter
[express]: https://expressjs.com/
[node-fetch-server]: https://www.npmjs.com/package/@remix-run/node-fetch-server
[framework-rsc-template]: https://github.com/remix-run/react-router-templates/tree/main/unstable_rsc-framework-mode
[vite-rsc-template]: https://github.com/remix-run/react-router-templates/tree/main/unstable_rsc-data-mode-vite
[node-request-listener]: https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener
[hooks]: https://react.dev/reference/react/hooks
[vite-env-only]: https://github.com/pcattori/vite-env-only
[server-modules]: ../api/framework-conventions/server-modules
[client-modules]: ../api/framework-conventions/client-modules
[server-only-package]: https://www.npmjs.com/package/server-only
[client-only-package]: https://www.npmjs.com/package/client-only
[entry-rsc-source]: https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/config/default-rsc-entries/entry.rsc.tsx
[entry-ssr-source]: https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/config/default-rsc-entries/entry.ssr.tsx
[entry-client-source]: https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/config/default-rsc-entries/entry.client.tsx
