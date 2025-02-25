---
"react-router": patch
---

Support `middleware` on routes (unstable)

Routes can now define an array of middleware functions that will run sequentially before route handlers run. These functions accept the same arguments as `loader`/`action` plus an additional `next` function to run the remaining data pipeline. This allows middlewares to perform logic before and after handlers execute.

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
async function clientLogger({
  request,
  params,
  context,
  next,
}: Route.ClientMiddlewareArgs) {
  let start = performance.now();

  // Run the remaining middlewares and all route loaders
  await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);
}
```

Note that in the above example, the `next`/`middleware` functions don't return anything. This is by design as on the client there is no "response" to send over the network like there would be for middlewares running on the server. The data is all handled behind the scenes by the stateful `router`.

For a server-side middleware, the `next` function will return the HTTP `Response` that React Router will be sending across the wire, thus giving you a chance to make changes as needed. You may throw a new response to short circuit and respond immediately, or you may return a new or altered response to override the default returned by `next()`.

```tsx
async function serverLogger({
  request,
  params,
  context,
  next,
}: Route.MiddlewareArgs) {
  let start = performance.now();

  // 👇 Grab the response here
  let res = await next();

  let duration = performance.now() - start;
  console.log(`Navigated to ${request.url} (${duration}ms)`);

  // 👇 And return it here
  return res;
}
```

You can throw a `redirect` from a middleware to short circuit any remaining processing:

```tsx
function serverAuth({ request, params, context, next }: Route.MiddlewareArgs) {
  let user = context.session.get("user");
  if (!user) {
    context.session.set("returnTo", request.url);
    throw redirect("/login", 302);
  }
  context.user = user;
  // No need to call next() if you don't need to do any post processing
}
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
