---
"react-router": patch
---

Support middleware on routes (unstable)

Middleware is implemented behind a `future.unstable_middleware` flag. To enable, you must enable the flag and the types in your `react-router-config.ts` file:

```ts
import type { Config } from "@react-router/dev/config";
import type { Future } from "react-router";

declare module "react-router" {
  interface Future {
    unstable_middleware: true; // 👈 Enable middleware types
  }
}

export default {
  future: {
    unstable_middleware: true, // 👈 Enable middleware
  },
} satisfies Config;
```

⚠️ Middleware is unstable and should not be adopted in production. There is at least one known de-optimization in route module loading for `clientMiddlware` usage that will very likely slow down your application navigations. We will be addressing this before a stable release.

⚠️ Enabling middleware contains a breaking change to the `context` parameter passed to your `loader`/`action` functions - see below for more information.

Once enabled, routes can define an array of middleware functions that will run sequentially before route handlers run. These functions accept the same parameters as `loader`/`action` plus an additional `next` parameter to run the remaining data pipeline. This allows middlewares to perform logic before and after handlers execute.

```tsx
// Framework mode
export const unstable_middleware = [serverLogger, serverAuth];
export const unstable_clientMiddleware = [clientLogger];

// Library mode
const routes = [
  {
    path: "/",
    unstable_middleware: [clientLogger, clientAuth],
    loader: rootLoader,
    Component: Root,
  },
];
```

Here's a simple example of a client-side logging middleware that can be placed on the root route:

```tsx
async function clientLogger({ request }, next) {
  let start = performance.now();

  // Run the remaining middlewares and all route loaders
  await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);
} satisfies Route.ClientMiddlewareFunction;
```

Note that in the above example, the `next`/`middleware` functions don't return anything. This is by design as on the client there is no "response" to send over the network like there would be for middlewares running on the server. The data is all handled behind the scenes by the stateful `router`.

For a server-side middleware, the `next` function will return the HTTP `Response` that React Router will be sending across the wire, thus giving you a chance to make changes as needed. You may throw a new response to short circuit and respond immediately, or you may return a new or altered response to override the default returned by `next()`.

```tsx
async function serverLogger({ request, params, context }, next) {
  let start = performance.now();

  // 👇 Grab the response here
  let res = await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);

  // 👇 And return it here
  return res;
} satisfies Route.MiddlewareFunction;
```

You can throw a `redirect` from a middleware to short circuit any remaining processing:

```tsx
import { sessionContext } from "../context";
function serverAuth({ request, params, context }, next) {
  let session = context.get(sessionContext);
  let user = session.get("user");
  if (!user) {
    session.set("returnTo", request.url);
    throw redirect("/login", 302);
  }
} satisfies Route.MiddlewareFunction;
```

_Note that in cases like this where you don't need to do any post-processing you don't need to call the `next` function or return a `Response`._

Here's another example of using a server middleware to detect 404s and check the CMS for a redirect:

```tsx
async function redirects({ request, next }: Route.MiddlewareArgs) {
  // attempt to handle the request
  let res = await next();

  // if it's a 404, check the CMS for a redirect, do it last
  // because it's expensive
  if (res.status === 404) {
    let cmsRedirect = await checkCMSRedirects(request.url);
    if (cmsRedirect) {
      throw redirect(cmsRedirect, 302);
    }
  }

  return res;
}
```

**`context` parameter**

When middleware is enabled, your application wil use a different type of `context` parameter in your loaders and actions to provide better type safety. `context` will now be an instance of `ContextProvider` that you use with type-safe contexts (similar to `React.createContext`):

```ts
import { unstable_createContext } from "react-router";
import { Route } from "./+types/root";
import type { Session } from "./sessions.server";
import { getSession } from "./sessions.server";

let sessionContext = unstable_createContext<Session>();

export function sessionMiddleware({ context, request }) {
  let session = await getSession(request);
  context.set(sessionContext, session);
} satisfies Route.MiddlewareFunction;

// ... then in some downstream middleware
export function loggerMiddleware({ context, request }) {
  let session = context.get(sessionContext);
  // ^ typeof Session
  console.log(session.get("userId"), request.method, request.url);
} satisfies Route.MiddlewareFunction;

// ... or some downstream loader
export function loader({ context }: Route.LoaderArgs) {
  let session = context.get(sessionContext);
  let profile = await getProfile(session.get('userId'));
  return { profile };
}
```
