---
title: Installation
order: 1
---

# Installation

[MODES: data]

## Initialize a new project

This guide uses Parcel, but applies to any RSC enabled bundler.

```
mkdir new-project
cd new-project
npm init -y
```

## Install Dependencies

Next install runtime dependencies from npm:

```shellscript nonumber
npm i react-router react react-dom react-server-dom-parcel @parcel/runtime-rsc @mjackson/node-fetch-server express compression cross-env
```

Along with development dependencies

```shellscript nonumber
npm i -D parcel typescript @types/react @types/react-dom @types/express @types/compression @types/node
```

## Configure Parcel

Edit your `package.json` to include the following values:

```json nonumber
{
  "targets": {
    "react-server": {
      "context": "react-server",
      "source": "src/server.ts",
      "scopeHoist": false,
      "includeNodeModules": {
        "@mjackson/node-fetch-server": false,
        "compression": false,
        "express": false
      }
    }
  },
  "scripts": {
    "dev": "cross-env NODE_ENV=development parcel",
    "build": "parcel build",
    "start": "cross-env NODE_ENV=production node dist/server/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

## Create a Server

Create a `src/server.ts` file that will be the entrypoint of our application.

```ts nonumber
import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";
import {
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error - no types for this yet
} from "react-server-dom-parcel/server.edge";
import type {
  unstable_DecodeCallServerFunction as DecodeCallServerFunction,
  unstable_DecodeFormActionFunction as DecodeFormActionFunction,
} from "react-router/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router/rsc";

// Import the prerender function from the client envrionment
import { prerender } from "./prerender" with { env: "react-client" };
import { routes } from "./routes/routes";

// Decode and load actions by ID to support post-hydration server actions.
const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

// Decode and load actions by form data to pre-hydration server actions.
const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

function callServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    decodeCallServer,
    decodeFormAction,
    decodeFormState,
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
app.use(compression(), express.static("public"));

// Ignore Chrome extension requests.
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.end();
});

// Hookup our application.
app.use(
  createRequestListener((request) =>
    prerender(
      request,
      callServer,
      (routes as unknown as { bootstrapScript?: string }).bootstrapScript
    )
  )
);

const PORT = Number.parseInt(process.env.PORT || "3000");
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
});
```

## Create our Prerender handler

Create a `src/prerender.tsx` file that will be responsible for rendering our application to HTML.

```tsx nonnumber
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
// @ts-expect-error - no types for this yet
import { createFromReadableStream } from "react-server-dom-parcel/client.edge";

export async function prerender(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
  bootstrapScriptContent: string | undefined
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to call the React Server.
    callServer,
    // Provide the React Server touchpoints.
    decode: createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
        }
      );
    },
  });
}
```

## Create our Browser entry

Create a `src/browser.tsx` file that will act as the entrypoint for hydration.

```tsx nonumber
"use client-entry";

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type { unstable_DecodeServerResponseFunction as DecodeServerResponseFunction } from "react-router";
import {
  unstable_createCallServer as createCallServer,
  unstable_getServerStream as getServerStream,
  unstable_RSCHydratedRouter as RSCHydratedRouter,
} from "react-router";
import {
  createFromReadableStream,
  encodeReply,
  setServerCallback,
  // @ts-expect-error - no types for this yet
} from "react-server-dom-parcel/client";

const decode: DecodeServerResponseFunction = (body) =>
  createFromReadableStream(body);

// Create and set the callServer function to support post-hydration server actions.
setServerCallback(
  createCallServer({
    decode,
    encodeAction: (args) => encodeReply(args),
  })
);

// Get and decode the initial server payload
decode(getServerStream()).then((payload) => {
  startTransition(async () => {
    hydrateRoot(
      document,
      <StrictMode>
        <RSCHydratedRouter
          decode={decode}
          payload={payload}
        />
      </StrictMode>
    );
  });
});
```

## Define our Routes

Create a `src/routes/routes.ts` file that will define our routes with dynamic imports.

```ts nonumber
"use server-entry";

import type { unstable_ServerRouteObject as ServerRouteObject } from "react-router/rsc";

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
  ] satisfies ServerRouteObject[];
}
```

## Create our Root Route

Create a `src/routes/root/route.tsx` file. This is the "server" portion of our route. We will make the ErrorBoundary and Layout client compnoents so we have access to stateful hooks.

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

---

Next: [Routing](./routing)
