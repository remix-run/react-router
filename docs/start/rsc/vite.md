---
title: Start Vite
order: 2
---

# Getting Started with Vite

[MODES: data]

## Initialize a new project

This guide uses Vite, but you can use any RSC enabled bundler.

```
mkdir new-project
cd new-project
npm init -y
```

## Install Dependencies

Next install runtime dependencies from npm:

```shellscript nonumber
npm i react-router react react-dom react-server-dom-parcel @mjackson/node-fetch-server express compression cross-env
```

Along with development dependencies

```shellscript nonumber
npm i -D vite vite-plugin-devtools-json @hiogawa/vite-rsc typescript @types/react @types/react-dom @types/express @types/compression @types/node
```

## Configure Parcel

Edit your `package.json` to include the following values:

```json nonumber
{
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "cross-env NODE_ENV=development vite",
    "start": "cross-env NODE_ENV=production node server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

## Create a Server

Create a `src/server.ts` file that will be the entrypoint of our application.

```ts nonumber
import {
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes/routes";

function fetchServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
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
  // Import the prerender function from the client envrionment
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./prerender")
  >("ssr", "index");

  return ssr.prerender(request, fetchServer);
}
```

## Create our Prerender handler

Create a `src/prerender.tsx` file that will be responsible for rendering our application to HTML.

```tsx nonnumber
import { createFromReadableStream } from "@hiogawa/vite-rsc/ssr";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";

export async function prerender(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to fetch from the React Server.
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
          // @ts-expect-error - no types for this yet
          formState,
        }
      );
    },
  });
}
```

## Create our Browser entry

Create a `src/browser.tsx` file that will act as the entrypoint for hydration.

```tsx nonumber
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
} from "@hiogawa/vite-rsc/browser";
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
        // @ts-expect-error - no types for this yet
        formState,
      }
    );
  });
});
```

## Define our Routes

Create a `src/routes/routes.ts` file that will define our routes with dynamic imports.

```ts nonumber
"use server-entry";

import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

import "../browser";

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

## Create our Root Route

Create a `src/routes/root/route.tsx` file. This is the "server" portion of our route. We will make the ErrorBoundary and Layout client components so we have access to stateful hooks.

```tsx nonumber
import { Outlet } from "react-router";

// Re-export the "client" portions of our route.
export { ErrorBoundary, Layout } from "./client";

export default function Component() {
  return <Outlet />;
}
```

Create a `src/routes/root/client.tsx` file. This is the "client" portion of our route.

```tsx nonumber
"use client";

import {
  isRouteErrorResponse,
  Link,
  NavLink,
  useNavigation,
  useRouteError,
} from "react-router";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          type="image/x-icon"
          href="/favicon.ico"
        />
      </head>
      <body>
        <header>
          <div>
            <div>
              <Link to="/">React Router 🚀</Link>
              <nav>
                <ul>
                  <li>
                    <NavLink to="/">Home</NavLink>
                  </li>
                  <li>
                    <NavLink to="/about">About</NavLink>
                  </li>
                </ul>
              </nav>
              <div>
                {navigation.state !== "idle" && (
                  <p>Loading...</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let status = 500;
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    message =
      status === 404
        ? "Page not found."
        : error.statusText || message;
  }

  return (
    <main>
      <article>
        <h1>{status}</h1>
        <p>{message}</p>
      </article>
    </main>
  );
}
```

## Create our Home and About Routes

Create a `src/routes/home/route.tsx` file.

```tsx nonumber
export default function Home() {
  return (
    <main>
      <article>
        <h1>Welcome to React Router RSC</h1>
        <p>
          This is a simple example of a React Router
          application using React Server Components (RSC)
          with Parcel. It demonstrates how to set up a basic
          routing structure and render components
          server-side.
        </p>
      </article>
    </main>
  );
}
```

Create a `src/routes/about/route.tsx` file.

```tsx nonumber
export default function About() {
  return (
    <main>
      <article>
        <h1>About Page</h1>
        <p>This is the about page of our application.</p>
      </article>
    </main>
  );
}
```

## Running the app

You can now run `npm run dev` to start your application.

## Production Mode

To serve our application in production, we create a `server.js` in the root of our project:

```js nonumber
import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";

import build from "./dist/rsc/index.js";

const app = express();

app.use(
  "/assets",
  compression(),
  express.static("dist/client/assets", {
    immutable: true,
    maxAge: "1y",
  })
);
app.use(compression(), express.static("dist/client"));

app.get(
  "/.well-known/appspecific/com.chrome.devtools.json",
  (_, res) => {
    res.status(404);
    res.end();
  }
);

app.use(createRequestListener(build));

const PORT = Number.parseInt(process.env.PORT || "3000");
app.listen(PORT, () => {
  console.log(
    `Server listening on port ${PORT} (http://localhost:${PORT})`
  );
});
```

You can now run `npm start` to start your application in production.

---

Next: [Routing](./routing)
