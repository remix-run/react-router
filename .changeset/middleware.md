---
"react-router": patch
---

Support `middleware` on routes (unstable)

Routes can now define a `middleware` property accepting an array of functions that will run sequentially before route loader run in parallel. These functions accept the same arguments as `loader`/`action` and an additional `next` function to run the remaining data pipeline. This allows middlewares to perform logic before and after loaders/actions execute.

```tsx
// Framework mode
export const middleware = [logger, auth];

// Library mode
const routes = [
  {
    path: "/",
    middleware: [logger, auth],
    loader: rootLoader,
    Component: Root,
  },
];
```

Here's a simple example of a client-side logging middleware that can be placed on the root route:

```tsx
const logger: MiddlewareFunction = ({ request, params, context }, next) => {
  let start = performance.now();

  // Run the remaining middlewares and all route loaders
  await next();

  let duration = performance.now() - start;
  console.log(request.status, request.method, request.url, `(${duration}ms)`);
};
```

You can throw a redirect from a middleware to short circuit any remaining processing:

```tsx
const auth: MiddlewareFunction = ({ request, params, context }, next) => {
  let user = session.get("user");
  if (!user) {
    session.set("returnTo", request.url);
    throw redirect("/login", 302);
  }
  context.user = user;
  // No need to call next() if you don't need to do any post processing
};
```

Note that in the above example, the `next`/`middleware` functions don't return anything. This is by design as on the client there is no "response" to send over the network like there would be for middlewares running on the server. The data is all handled behind the scenes by the stateful `router`.

For a server-side middleware, the `next` function will return the HTTP `Response` that React Router will be sending across the wire, thus giving you a chance to make changes as needed. You may throw a new response to short circuit and respond immediately, or you may return a new or altered response to override the default returned by `next()`.

```tsx
const redirects: MiddlewareFunction({ request }, next) {
  // attempt to handle the request
  let response = await next();

  // if it's a 404, check the CMS for a redirect, do it last
  // because it's expensive
  if (response.status === 404) {
    let cmsRedirect = await checkCMSRedirects(request.url);
    if (cmsRedirect) {
      throw redirect(cmsRedirect, 302);
    }
  }

  return response;
}
```
