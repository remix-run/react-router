---
title: Middleware
unstable: true
---

# Middleware

<docs-warning>The middleware feature is currently experimental and subject to breaking changes. Use the `future.unstable_middleware` flag to enable it.</docs-warning>

Middleware allows you to run code before and after the `Response` generation for the matched path. This enables common patterns like authentication, logging, error handling, and data preprocessing in a reusable way.

Middleware runs in a nested chain, executing from parent routes to child routes on the way "down" to your route handlers, then from child routes back to parent routes on the way "up" after a `Response` is generated.

For example, on a `GET /parent/child` request, the middleware would run in the following order:

```text
- Root middleware start
  - Parent middleware start
    - Child middleware start
      - Run loaders, generate HTML Response
    - Child middleware end
  - Parent middleware end
- Root middleware end
```

## Quick Start

### 1. Enable the middleware flag

First, enable middleware in your React Router config:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_middleware: true,
  },
} satisfies Config;
```

<docs-warning>By enabling the middleware feature, you change the type of the `context` parameter to your loaders and actions. Please pay attention to the section on [getLoadContext](#changes-to-getloadcontextapploadcontext) below if you are actively using `context` today.</docs-warning>

### 2. Create a context

Middleware uses a `context` provider instance to provide data down the middleware chain.
You can create type-safe context objects using `unstable_createContext`:

```ts filename=app/context.ts
import { unstable_createContext } from "react-router";
import type { User } from "~/types";

export const userContext =
  unstable_createContext<User | null>(null);
```

### 3. Export middleware from your routes

```tsx filename=app/routes/dashboard.tsx
import { redirect } from "react-router";
import { userContext } from "~/context";

// Server-side Authentication Middleware
export const unstable_middleware: Route.unstable_MiddlewareFunction[] =
  [
    async ({ request, context }) => {
      const user = await getUserFromSession(request);
      if (!user) {
        throw redirect("/login");
      }
      context.set(userContext, user);
    },
  ];

// Client-side timing middleware
export const unstable_clientMiddleware: Route.unstable_ClientMiddlewareFunction[] =
  [
    async ({ context }, next) => {
      const start = performance.now();

      await next();

      const duration = performance.now() - start;
      console.log(`Navigation took ${duration}ms`);
    },
  ];

export async function loader({
  context,
}: Route.LoaderArgs) {
  const user = context.get(userContext);
  const profile = await getProfile(user);
  return { profile };
}

export default function Dashboard({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div>
      <h1>Welcome {loaderData.profile.fullName}!</h1>
      <Profile profile={loaderData.profile} />
    </div>
  );
}
```

#### 4. Update your `getLoadContext` function (if applicable)

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return an instance of `unstable_RouterContextProvider`, instead of a JavaScript object:

```diff
+import {
+  unstable_createContext,
+  unstable_RouterContextProvider,
+} from "react-router";
import { createDb } from "./db";

+const dbContext = unstable_createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  return new unstable_RouterContextProvider(
+    new Map([[dbContext, createDb()]])
+  );
}
```

## Core Concepts

### Server vs Client Middleware

**Server middleware** (`unstable_middleware`) runs on the server for:

- HTML Document requests
- `.data` requests for subsequent navigations and fetcher calls

**Client middleware** (`unstable_clientMiddleware`) runs in the browser for:

- Client-side navigations and fetcher calls

### Context API

The new context system provides type safety and prevents naming conflicts:

```ts
// ✅ Type-safe
import { unstable_createContext } from "react-router";
const userContext = unstable_createContext<User>();

// Later in middleware/loaders
context.set(userContext, user); // Must be User type
const user = context.get(userContext); // Returns User type

// ❌ Old way (no type safety)
// context.user = user; // Could be anything
```

### The `next` Function

The `next` function logic depends on which route middleware it's being called from:

- When called from a non-leaf middleware, it runs the next middleware in the chain
- When called from the leaf middleware, it executes any route handlers and generates the resulting `Response` for the request

```ts
const middleware = async ({ context }, next) => {
  // Code here runs BEFORE handlers
  console.log("Before");

  const response = await next();

  // Code here runs AFTER handlers
  console.log("After");

  return response; // Optional on client, required on server
};
```

<docs-warning>You can only call `next()` once per middleware. Calling it multiple times will throw an error</docs-warning>

### Skipping `next()`

If you don't need to run code after your handlers, you can skip calling `next()`:

```ts
const authMiddleware = async ({ request, context }) => {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  context.set(userContext, user);
  // next() is called automatically
};
```

### `next()` and Error Handling

React Router contains built-in error handling via the route [`ErrorBoundary`](../start/framework/route-module#errorboundary) export. Just like when a loader/acton throws, if a middleware throws an error it will be caught and handled at the appropriate `ErrorBoundary` and the `Response` will be returned through the ancestor `next()` call. This means that the `next()` function should never throw and should always return a `Response`, so you don't need to worry about wrapping it in a try/catch.

This behavior is important to allow middleware patterns such as automatically setting required headers on outgoing responses (i.e., committing a session) from a root middleware. If any error from a middleware caused `next()` to `throw`, we'd miss the execution of ancestor middlewares on the way out and those required headers wouldn't be set.

```tsx
// routes/parent.tsx
export const unstable_middleware = [
  async (_, next) => {
    let res = await next();
    //  ^ res.status = 500
    // This response contains the ErrorBoundary
    return res;
  }
]

// routes/parent.child.tsx
export const unstable_middleware = [
  async (_, next) => {
    let res = await next();
    //  ^ res.status = 200
    // This response contains the successful UI render
    throw new Error('Uh oh, something went wrong!)
  }
]
```

## Changes to `getLoadContext`/`AppLoadContext`

<docs-info>This only applies if you are using a custom server and a custom `getLoadContext` function</docs-info>

Middleware introduces a breaking change to the `context` parameter generated by `getLoadContext` and passed to your loaders and actions. The current approach of a module-augmented `AppLoadContext` isn't really type-safe and instead just sort of tells TypeScript to "trust me".

Middleware needs an equivalent `context` on the client for `clientMiddleware`, but we didn't want to duplicate this pattern from the server that we already weren't thrilled with, so we decided to introduce a new API where we could tackle type-safety.

When opting into middleware, the `context` parameter changes to an instance of `RouterContextProvider`:

```ts
let dbContext = unstable_createContext<Database>();
let context = new unstable_RouterContextProvider();
context.set(dbContext, getDb());
//                     ^ type-safe
let db = context.get(dbContext);
//  ^ Database
```

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return an instance of `unstable_RouterContextProvider`, instead of a plain JavaScript object:

```diff
+import {
+  unstable_createContext,
+  unstable_RouterContextProvider,
+} from "react-router";
import { createDb } from "./db";

+const dbContext = unstable_createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  return new unstable_RouterContextProvider(
+    new Map([[dbContext, createDb()]])
+  );
}
```

### Migration from `AppLoadContext`

If you're currently using `AppLoadContext`, you can migrate incrementally by using your existing module augmentation to augment `unstable_RouterContextProvider` instead of `AppLoadContext`. Then, update your `getLoadContext` function to return an instance of `unstable_RouterContextProvider`:

```diff
declare module "react-router" {
-  interface AppLoadContext {
+  interface unstable_RouterContextProvider {
    db: Database;
    user: User;
  }
}

function getLoadContext() {
  const loadContext = {...};
-  return loadContext;
+  let context = new unstable_RouterContextProvider();
+  Object.assign(context, loadContext);
+  return context;
}
```

This allows you to leave your loaders/actions untouched during initial adoption of middleware, since they can still read values directly (i.e., `context.db`).

<docs-warning>This approach is only intended to be used as a migration strategy when adopting middleware in React Router v7, allowing you to incrementally migrate to `context.set`/`context.get`. It is not safe to assume this approach will work in the next major version of React Router.</docs-warning>

<docs-warning>The `unstable_RouterContextProvider` class is also used for the client-side `context` parameter via `<HydratedRouter unstable_getContext>` and `<RouterProvider unstable_getContext>`. Since `AppLoadContext` is primarily intended as a hand-off from your HTTP server into the React Router handlers, you need to be aware that these augmented fields will not be available in `clientMiddleware`, `clientLoader`, or `clientAction` functions even thought TypeScript will tell you they are (unless, of course, you provide the fields via `unstable_getContext` on the client).</docs-warning>

## Common Patterns

### Authentication

```tsx filename=app/middleware/auth.ts
import { redirect } from "react-router";
import { userContext } from "~/context";
import { getSession } from "~/sessions.server";

export const authMiddleware = async ({
  request,
  context,
}) => {
  const session = await getSession(request);
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/login");
  }

  const user = await getUserById(userId);
  context.set(userContext, user);
};
```

```tsx filename=app/routes/protected.tsx
import { authMiddleware } from "~/middleware/auth";

export const unstable_middleware = [authMiddleware];

export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext); // Guaranteed to exist
  return { user };
}
```

### Logging

```tsx filename=app/middleware/logging.ts
import { requestIdContext } from "~/context";

export const loggingMiddleware = async (
  { request, context },
  next,
) => {
  const requestId = crypto.randomUUID();
  context.set(requestIdContext, requestId);

  console.log(
    `[${requestId}] ${request.method} ${request.url}`,
  );

  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  console.log(
    `[${requestId}] Response ${response.status} (${duration}ms)`,
  );

  return response;
};
```

### 404 to CMS Redirect

```tsx filename=app/middleware/cms-fallback.ts
export const cmsFallbackMiddleware = async (
  { request },
  next,
) => {
  const response = await next();

  // Check if we got a 404
  if (response.status === 404) {
    // Check CMS for a redirect
    const cmsRedirect = await checkCMSRedirects(
      request.url,
    );
    if (cmsRedirect) {
      throw redirect(cmsRedirect, 302);
    }
  }

  return response;
};
```

### Response Headers

```tsx filename=app/middleware/headers.ts
export const headersMiddleware = async (
  { context },
  next,
) => {
  const response = await next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
};
```

### Conditional Middleware

```tsx
export const unstable_middleware = [
  async ({ request, context }, next) => {
    // Only run auth for POST requests
    if (request.method === "POST") {
      await ensureAuthenticated(request, context);
    }
    return next();
  },
];
```

### Sharing Context Between Action and Loader

```tsx
const sharedDataContext = unstable_createContext<any>();

export const unstable_middleware = [
  async ({ request, context }, next) => {
    if (request.method === "POST") {
      // Set data during action phase
      context.set(
        sharedDataContext,
        await getExpensiveData(),
      );
    }
    return next();
  },
];

export async function action({
  context,
}: Route.ActionArgs) {
  const data = context.get(sharedDataContext);
  // Use the data...
}

export async function loader({
  context,
}: Route.LoaderArgs) {
  const data = context.get(sharedDataContext);
  // Same data is available here
}
```

## Client-Side Middleware

Client middleware works similar to server-side middleware but doesn't return responses because it's not running ion response to an HTTP `Request`:

```tsx filename=app/routes/dashboard.tsx
import { userContext } from "~/context";

export const unstable_clientMiddleware = [
  ({ context }) => {
    // Set up client-side user data
    const user = getLocalUser();
    context.set(userContext, user);
  },

  async ({ context }, next) => {
    console.log("Starting client navigation");
    await next(); // 👈 No return value
    console.log("Client navigation complete");
  },
];

export async function clientLoader({
  context,
}: Route.ClientLoaderArgs) {
  const user = context.get(userContext);
  return { user };
}
```
