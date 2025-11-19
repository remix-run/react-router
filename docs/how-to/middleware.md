---
title: Middleware
---

# Middleware

[MODES: framework, data]

<br/>
<br/>

<docs-info>In Framework Mode, you must opt-into middleware via the [`future.v8_middleware`][future-flags] flag because it contains a minor [breaking change][getloadcontext] to the `getLoadContext` function and the loader/action `context` parameter.</docs-info>

Middleware allows you to run code before and after the [`Response`][Response] generation for the matched path. This enables [common patterns][common-patterns] like authentication, logging, error handling, and data preprocessing in a reusable way.

Middleware runs in a nested chain, executing from parent routes to child routes on the way "down" to your route handlers, then from child routes back to parent routes on the way "up" after a [`Response`][Response] is generated.

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

<docs-info>There are some slight differences between middleware on the server (framework mode) versus the client (framework/data mode). For the purposes of this document, we'll be referring to Server Middleware in most of our examples as it's the most familiar to users who've used middleware in other HTTP servers in the past. Please refer to the [Server vs Client Middleware][server-client] section below for more information.</docs-info>

## Quick Start (Framework mode)

### 1. Enable the middleware flag

First, enable middleware in your [React Router config][rr-config]:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    v8_middleware: true,
  },
} satisfies Config;
```

<docs-warning>By enabling the middleware feature, you change the type of the `context` parameter to your [`action`][framework-action]s and [`loader`][framework-loader]s. Please pay attention to the section on [`getLoadContext`][getloadcontext] below if you are actively using `context` today.</docs-warning>

### 2. Create a context

Middleware uses a `context` provider instance to provide data down the middleware chain.
You can create type-safe context objects using [`createContext`][createContext]:

```ts filename=app/context.ts
import { createContext } from "react-router";
import type { User } from "~/types";

export const userContext = createContext<User | null>(null);
```

### 3. Export middleware from your routes

```tsx filename=app/routes/dashboard.tsx
import { redirect } from "react-router";
import { userContext } from "~/context";

// Server-side Authentication Middleware
async function authMiddleware({ request, context }) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/login");
  }
  context.set(userContext, user);
}

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
];

// Client-side timing middleware
async function timingMiddleware({ context }, next) {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  console.log(`Navigation took ${duration}ms`);
}

export const clientMiddleware: Route.ClientMiddlewareFunction[] =
  [timingMiddleware];

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

### 4. Update your `getLoadContext` function (if applicable)

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return an instance of [`RouterContextProvider`][RouterContextProvider], instead of a JavaScript object:

```diff
+import {
+  createContext,
+  RouterContextProvider,
+} from "react-router";
import { createDb } from "./db";

+const dbContext = createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  const context = new RouterContextProvider();
+  context.set(dbContext, createDb());
+  return context;
}
```

## Quick Start (Data Mode)

<docs-info>Note there is no future flag in Data Mode because you can opt-into middleware by adding it to your routes, no breaking changes exist that require a future flag.</docs-info>

### 1. Create a context

Middleware uses a `context` provider instance to provide data down the middleware chain.
You can create type-safe context objects using [`createContext`][createContext]:

```ts
import { createContext } from "react-router";
import type { User } from "~/types";

export const userContext = createContext<User | null>(null);
```

### 2. Add middleware to your routes

```tsx
import { redirect } from "react-router";
import { userContext } from "~/context";

const routes = [
  {
    path: "/",
    middleware: [timingMiddleware], // 👈
    Component: Root,
    children: [
      {
        path: "profile",
        middleware: [authMiddleware], // 👈
        loader: profileLoader,
        Component: Profile,
      },
      {
        path: "login",
        Component: Login,
      },
    ],
  },
];

async function timingMiddleware({ context }, next) {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  console.log(`Navigation took ${duration}ms`);
}

async function authMiddleware({ context }) {
  const user = await getUser();
  if (!user) {
    throw redirect("/login");
  }
  context.set(userContext, user);
}

export async function profileLoader({
  context,
}: Route.LoaderArgs) {
  const user = context.get(userContext);
  const profile = await getProfile(user);
  return { profile };
}

export default function Profile() {
  let loaderData = useLoaderData();
  return (
    <div>
      <h1>Welcome {loaderData.profile.fullName}!</h1>
      <Profile profile={loaderData.profile} />
    </div>
  );
}
```

### 3. Add a `getContext` function (optional)

If you wish to include a base context on all navigations/fetches, you can add an [`getContext`][getContext] function to your router. This will be called to populate a fresh context on every navigation/fetch.

```tsx
let sessionContext = createContext();

const router = createBrowserRouter(routes, {
  getContext() {
    let context = new RouterContextProvider();
    context.set(sessionContext, getSession());
    return context;
  },
});
```

<docs-info>This API exists to mirror the `getLoadContext` API on the server in Framework Mode, which exists as a way to hand off values from your HTTP server to the React Router handler. This [`getContext`][getContext] API can be used to hand off global values from the [`window`][window]/[`document`][document] to React Router, but because they're all running in the same context (the browser), you can achieve effectively the same behavior with root route middleware. Therefore, you may not need this API the same way you would on the server - but it's provided for consistency.</docs-warning>

## Core Concepts

### Server vs Client Middleware

Server middleware runs on the server in Framework mode for HTML Document requests and `.data` requests for subsequent navigations and fetcher calls. Because server middleware runs on the server in response to an HTTP [`Request`][request], it returns an HTTP [`Response`][Response] back up the middleware chain via the `next` function:

```ts
async function serverMiddleware({ request }, next) {
  console.log(request.method, request.url);
  let response = await next();
  console.log(response.status, request.method, request.url);
  return response;
}

// Framework mode only
export const middleware: Route.MiddlewareFunction[] = [
  serverMiddleware,
];
```

Client middleware runs in the browser in framework and data mode for client-side navigations and fetcher calls. Client middleware differs from server middleware because there's no HTTP Request, so it doesn't have a `Response` to bubble up. In most cases, you can just ignore the return value from `next` and return nothing from your middleware on the client:

```ts
async function clientMiddleware({ request }, next) {
  console.log(request.method, request.url);
  await next();
  console.log(response.status, request.method, request.url);
}

// Framework mode
export const clientMiddleware: Route.ClientMiddlewareFunction[] =
  [clientMiddleware];

// Or, Data mode
const route = {
  path: "/",
  middleware: [clientMiddleware],
  loader: rootLoader,
  Component: Root,
};
```

There may be _some_ cases where you want to do some post-processing based on the result of the loaders/action. In lieu of a `Response`, client middleware bubbles up the value returned from the active [`dataStrategy`][datastrategy] (`Record<string, DataStrategyResult>` - keyed by route id). This allows you to take conditional action in your middleware based on the outcome of the executed `loader`/`action` functions.

Here's an example of the [CMS Redirect on 404][cms-redirect] use case implemented as a client side middleware:

```tsx
async function cmsFallbackMiddleware({ request }, next) {
  const results = await next();

  // Check if we got a 404 from any of our routes and if so, look for a
  // redirect in our CMS
  const found404 = Object.values(results).some(
    (r) =>
      isRouteErrorResponse(r.result) &&
      r.result.status === 404,
  );
  if (found404) {
    const cmsRedirect = await checkCMSRedirects(
      request.url,
    );
    if (cmsRedirect) {
      throw redirect(cmsRedirect, 302);
    }
  }
}
```

<docs-warning>In a server middleware, you shouldn't be messing with the `Response` body and should only be reading status/headers and setting headers. Similarly, this value should be considered read-only in client middleware because it represents the "body" or "data" for the resulting navigation which should be driven by loaders/actions - not middleware. This also means that in client middleware, there's usually no need to return the results even if you needed to capture it from `await next()`;</docs-warning>

### When Middleware Runs

It is very important to understand _when_ your middlewares will run to make sure your application is behaving as you intend.

#### Server Middleware

In a hydrated Framework Mode app, server middleware is designed such that it prioritizes SPA behavior and does not create new network activity by default. Middleware wraps _existing_ requests and only runs when you _need_ to hit the server.

This raises the question of what is a "handler" in React Router? Is it the route? Or the `loader`? We think "it depends":

- On document requests (`GET /route`), the handler is the route — because the response encompasses both the `loader` and the route component
- On data requests (`GET /route.data`) for client-side navigations, the handler is the [`action`][data-action]/[`loader`][data-loader], because that's all that is included in the response

Therefore:

- Document requests run server middleware whether `loader`s exist or not because we're still in a "handler" to render the UI
- Client-side navigations will only run server middleware if a `.data` request is made to the server for a [`action`][framework-action]/[`loader`][framework-loader]

This is important behavior for request-annotation middlewares such as logging request durations, checking/setting sessions, setting outgoing caching headers, etc. It would be useless to go to the server and run those types of middlewares when there was no reason to go to the server in the first place. This would result in increased server load and noisy server logs.

```tsx filename=app/root.tsx
// This middleware won't run on client-side navigations without a `.data` request
async function loggingMiddleware({ request }, next) {
  console.log(`Request: ${request.method} ${request.url}`);
  let response = await next();
  console.log(
    `Response: ${response.status} ${request.method} ${request.url}`,
  );
  return response;
}

export const middleware: Route.MiddlewareFunction[] = [
  loggingMiddleware,
];
```

However, there may be cases where you _want_ to run certain server middlewares on _every_ client-navigation - even if no `loader` exists. For example, a form in the authenticated section of your site that doesn't require a `loader` but you'd rather use auth middleware to redirect users away before they fill out the form — rather than when they submit to the `action`. If your middleware meets these criteria, then you can put a `loader` on the route that contains the middleware to force it to always call the server for client-side navigations involving that route.

```tsx filename=app/_auth.tsx
function authMiddleware({ request }, next) {
  if (!isLoggedIn(request)) {
    throw redirect("/login");
  }
}

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
];

// By adding a `loader`, we force the `authMiddleware` to run on every
// client-side navigation involving this route.
export async function loader() {
  return null;
}
```

#### Client Middleware

Client middleware is simpler because since we are already on the client and are always making a "request" to the router when navigating. Client middlewares will run on every client navigation, regardless of whether there are `loader`s to run.

### Context API

The new context system provides type safety and prevents naming conflicts and allows you to provide data to nested middlewares and `action`/`loader` functions. In Framework Mode, this replaces the previous `AppLoadContext` API.

```ts
// ✅ Type-safe
import { createContext } from "react-router";
const userContext = createContext<User>();

// Later in middleware/`loader`s
context.set(userContext, user); // Must be `User` type
const user = context.get(userContext); // Returns `User` type

// ❌ Old way (no type safety)
context.user = user; // Could be anything
```

#### `Context` and `AsyncLocalStorage`

Node provides an [`AsyncLocalStorage`][asynclocalstorage] API which gives you a way to provide values through asynchronous execution contexts. While this is a Node API, most modern runtimes have made it (mostly) available (i.e., [Cloudflare][cloudflare], [Bun][bun], [Deno][deno]).

In theory, we could have leveraged [`AsyncLocalStorage`][asynclocalstorage] directly as the way to pass values from middlewares to child routes, but the lack of 100% cross-platform compatibility was concerning enough that we wanted to still ship a first-class `context` API so there would be a way to publish reusable middleware packages guaranteed to work in a runtime-agnostic manner.

That said, this API still works great with React Router middleware and can be used in place of, or alongside of the `context` API:

<docs-info>[`AsyncLocalStorage`][asynclocalstorage] is _especially_ powerful when using [React Server Components](../how-to/react-server-components) because it allows you to provide information from `middleware` to your Server Components and Server Actions because they run in the same server execution context 🤯</docs-info>

```tsx filename=app/user-context.ts
import { AsyncLocalStorage } from "node:async_hooks";

const USER = new AsyncLocalStorage<User>();

export async function provideUser(
  request: Request,
  cb: () => Promise<Response>,
) {
  let user = await getUser(request);
  return USER.run(user, cb);
}

export function getUser() {
  return USER.getStore();
}
```

```tsx filename=app/root.tsx
import { provideUser } from "./user-context";

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    return provideUser(request, async () => {
      let res = await next();
      return res;
    });
  },
];
```

```tsx filename=app/routes/_index.tsx
import { getUser } from "../user-context";

export async function loader() {
  let user = getUser();
  //...
}
```

### The `next` function

The `next` function logic depends on which route middleware it's being called from:

- When called from a non-leaf middleware, it runs the next middleware in the chain
- When called from the leaf middleware, it executes any route handlers and generates the resulting [`Response`][Response] for the request

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

React Router contains built-in error handling via the route [`ErrorBoundary`][ErrorBoundary] export. Just like when a `action`/`loader` throws, if a `middleware` throws it will be caught and handled at the appropriate [`ErrorBoundary`][ErrorBoundary] and a [`Response`][Response] will be returned through the ancestor `next()` call. This means that the `next()` function should never throw and should always return a [`Response`][Response], so you don't need to worry about wrapping it in a try/catch.

This behavior is important to allow middleware patterns such as automatically setting required headers on outgoing responses (i.e., committing a session) from a root `middleware`. If any error from a `middleware` caused `next()` to `throw`, we'd miss the execution of ancestor middlewares on the way out and those required headers wouldn't be set.

```tsx filename=routes/parent.tsx
export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    let res = await next();
    //  ^ res.status = 500
    // This response contains the ErrorBoundary
    return res;
  },
];
```

```tsx filename=routes/parent.child.tsx
export const middleware: Route.MiddlewareFunction[] = [
  async (_, next) => {
    let res = await next();
    //  ^ res.status = 200
    // This response contains the successful UI render
    throw new Error("Uh oh, something went wrong!");
  },
];
```

Which `ErrorBoundary` is rendered will differ based on whether your middleware threw _before_ or _after_ calling then `next()` function. If it throws _after_ then it will bubble up from the throwing route just like a normal loader error because we've already run the loaders and have the appropriate `loaderData` to render in the route components. However, if an error is thrown _before_ calling `next()`, then we haven't called any loaders yet and there is no `loaderData` available. When this happens, we must bubble up to the highest route with a `loader` and start looking for an `ErrorBoundary` there. We cannot render any route components at that level or below without any `loaderData`.

## Changes to `getLoadContext`/`AppLoadContext`

<docs-info>This only applies if you are using a custom server and a custom `getLoadContext` function</docs-info>

Middleware introduces a breaking change to the `context` parameter generated by `getLoadContext` and passed to your `action`s and `loader`s. The current approach of a module-augmented `AppLoadContext` isn't really type-safe and instead just sort of tells TypeScript to "trust me".

Middleware needs an equivalent `context` on the client for `clientMiddleware`, but we didn't want to duplicate this pattern from the server that we already weren't thrilled with, so we decided to introduce a new API where we could tackle type-safety.

When opting into middleware, the `context` parameter changes to an instance of [`RouterContextProvider`][RouterContextProvider]:

```ts
let dbContext = createContext<Database>();
let context = new RouterContextProvider();
context.set(dbContext, getDb());
//                     ^ type-safe
let db = context.get(dbContext);
//  ^ Database
```

If you're using a custom server and a `getLoadContext` function, you will need to update your implementation to return an instance of [`RouterContextProvider`][RouterContextProvider], instead of a plain JavaScript object:

```diff
+import {
+  createContext,
+  RouterContextProvider,
+} from "react-router";
import { createDb } from "./db";

+const dbContext = createContext<Database>();

function getLoadContext(req, res) {
-  return { db: createDb() };
+  const context = new RouterContextProvider();
+  context.set(dbContext, createDb());
+  return context;
}
```

### Migration from `AppLoadContext`

If you're currently using `AppLoadContext`, you can migrate incrementally by using your existing module augmentation to augment [`RouterContextProvider`][RouterContextProvider] instead of `AppLoadContext`. Then, update your `getLoadContext` function to return an instance of [`RouterContextProvider`][RouterContextProvider]:

```diff
declare module "react-router" {
-  interface AppLoadContext {
+  interface RouterContextProvider {
    db: Database;
    user: User;
  }
}

function getLoadContext() {
  const loadContext = {...};
-  return loadContext;
+  let context = new RouterContextProvider();
+  Object.assign(context, loadContext);
+  return context;
}
```

This allows you to leave your `action`s/`loader`s untouched during initial adoption of middleware, since they can still read values directly (i.e., `context.db`).

<docs-warning>This approach is only intended to be used as a migration strategy when adopting middleware in React Router v7, allowing you to incrementally migrate to `context.set`/`context.get`. It is not safe to assume this approach will work in the next major version of React Router.</docs-warning>

<docs-warning>The [`RouterContextProvider`][RouterContextProvider] class is also used for the client-side `context` parameter via `<HydratedRouter getContext>` and `<RouterProvider getContext>`. Since `AppLoadContext` is primarily intended as a hand-off from your HTTP server into the React Router handlers, you need to be aware that these augmented fields will not be available in `clientMiddleware`, `clientLoader`, or `clientAction` functions even thought TypeScript will tell you they are (unless, of course, you provide the fields via `getContext` on the client).</docs-warning>

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

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({
  context,
}: Route.LoaderArgs) {
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

### CMS Redirect on 404

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
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    // Only run auth for POST requests
    if (request.method === "POST") {
      await ensureAuthenticated(request, context);
    }
    return next();
  },
];
```

### Sharing Context Between `action` and `loader`

<docs-info>On the server, this approach only works for document POST requests because `context` is scoped to a request. SPA navigation submissions use separate POST/GET requests so you cannot share `context` between them. This pattern always works in `clientMiddleware`/`clientLoader`/`clientAction` because there's no separate HTTP requests.</docs-info>

```tsx
const sharedDataContext = createContext<any>();

export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    // Set data if it doesn't exist
    // This will only run once for document requests
    // It will run twice (action request + loader request) in SPA submissions
    if (!context.get(sharedDataContext)) {
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

[future-flags]: ../upgrading/future
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[common-patterns]: #common-patterns
[server-client]: #server-vs-client-middleware
[rr-config]: ../api/framework-conventions/react-router.config.ts
[framework-action]: ../start/framework/route-module#action
[framework-loader]: ../start/framework/route-module#loader
[getloadcontext]: #changes-to-getloadcontextapploadcontext
[datastrategy]: ../api/data-routers/createBrowserRouter#optsdatastrategy
[cms-redirect]: #cms-redirect-on-404
[createContext]: ../api/utils/createContext
[RouterContextProvider]: ../api/utils/RouterContextProvider
[getContext]: ../api/data-routers/createBrowserRouter#optsgetContext
[window]: https://developer.mozilla.org/en-US/docs/Web/API/Window
[document]: https://developer.mozilla.org/en-US/docs/Web/API/Document
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[data-action]: ../start/data/route-object#action
[data-loader]: ../start/data/route-object#loader
[asynclocalstorage]: https://nodejs.org/api/async_context.html#class-asynclocalstorage
[cloudflare]: https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/
[bun]: https://bun.sh/blog/bun-v0.7.0#asynclocalstorage-support
[deno]: https://docs.deno.com/api/node/async_hooks/~/AsyncLocalStorage
[ErrorBoundary]: ../start/framework/route-module#errorboundary
