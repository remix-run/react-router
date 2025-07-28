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

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return a Map of contexts and values, instead of a JavaScript object:

```diff
+import { unstable_createContext } from "react-router";
import { createDb } from "./db";
+
+const dbContext = unstable_createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  const map = new Map([[dbContext, createDb()]]);
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

`next()` is not designed to throw errors under normal conditions, so you generally shouldn't find yourself wrapping `next` in a `try`/`catch`. The responsibility of the `next()` function is to return a `Response` for the current `Request`, so as long as that can be completed, `next()` will return the Response and won't `throw`. Even if a `loader` throws an error, or a component fails to render, React Router already handles those by rendering the nearest `ErrorBoundary`, so a Response is still generated without issue.

This behavior is important to allow middleware patterns such as automatically setting required headers on outgoing responses (i.e., committing a session) from a root middleware. If any error caused that to throw, we'd miss the execution of ancestor middleware son thew way out and those required headers wouldn't be set.

The only cases in which `next()` _should_ throw are if we fail to generate a Response. There's a few ways in which this could happen:

- A middleware can short circuit the rest of the request and throw a `Response` (usually a `redirect`)
- If the logic directly inside of a middleware function throws, that will cause the ancestor `next()` function to throw

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

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return a `Map` of contexts and values, instead of a JavaScript object:

```diff
+import { unstable_createContext } from "react-router";
import { createDb } from "./db";
+
+const dbContext = unstable_createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  const map = new Map([[dbContext, createDb()]]);
}
```

### Migration from `AppLoadContext`

If you're currently using `AppLoadContext`, you can migrate most easily by creating a context for your existing object:

```ts filename=app/context.ts
import { unstable_createContext } from "react-router";

declare module "@react-router/server-runtime" {
  interface AppLoadContext {
    db: Database;
    user: User;
  }
}

const myLoadContext =
  unstable_createContext<AppLoadContext>();
```

Update your `getLoadContext` function to return a Map with the context initial value:

```diff filename=server.ts
function getLoadContext() {
  const loadContext = {...};
-  return loadContext;
+  return new Map([
+    [myLoadContext, loadContext]]
+  );
}
```

Update your loaders/actions to read from the new context instance:

```diff filename=app/routes/example.tsx
export function loader({ context }: Route.LoaderArgs) {
-  const { db, user } = context;
+  const { db, user } = context.get(myLoadContext);
}
```

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
