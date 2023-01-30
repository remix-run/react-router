---
"@remix-run/router": minor
---

Adds support for "middleware" on routes to give you a common place to run before and after your loaders and actions in a single location higher up in the routing tree. The API we landed on is inspired by the middleware API in [Fresh](https://fresh.deno.dev/docs/concepts/middleware) since it supports the concept of nested routes and also allows you to run logic on the response _after_ the fact.

This feature is behind a `future.unstable_middleware` flag at the moment, but major API changes are not expected and we believe it's ready for production usage. This flag allows us to make small "breaking" changes if users run into unforeseen issues.

To opt into the middleware feature, you pass the flag to your `createBrowserRouter` (or equivalent) method, and then you can define a `middleware` function on your routes:

```tsx
import {
  createBrowserRouter,
  createMiddlewareContext,
  RouterProvider,
} from "react-router-dom";
import { getSession, commitSession } from "../session";
import { getPosts } from "../posts";

// Create strongly-typed contexts to use for your middleware data
let userCtx = createMiddlewareContext<User>(null);
let sessionCtx = createMiddlewareContext<Session>(null);

const routes = [
  {
    path: "/",
    middleware: rootMiddleware,
    children: [
      {
        path: "path",
        loader: childLoader,
      },
    ],
  },
];

const router = createBrowserRouter(routes, {
  future: {
    unstable_middleware: true,
  },
});

function App() {
  return <RouterProvider router={router} />;
}

async function rootMiddleware({ request, context }) {
  // 🔥 Load common information in one spot in your middleware and make it
  // available to child middleware/loaders/actions
  let session = await getSession(request.headers.get("Cookie"));
  let user = await getUser(session);
  middleware.set(userCtx, user);
  middleware.set(sessionCtx, session);

  // Call child middleware/loaders/actions
  let response = await middleware.next();

  // 🔥 Assign common response headers on the way out
  response.headers.append("Set-Cookie", await commitSession(session));
  return response;
}

async function childLoader({ context }) {
  // 🔥 Read strongly-typed data from ancestor middlewares
  let session = context.get(sessionCtx);
  let user = context.get(userCtx);

  let posts = await getPosts({ author: user.id });
  return redirect(`/posts/${post.id}`);
}
```

⚠️ Please note that middleware is executed on a per-`loader`/`action` basis because they can alter the `Response` from the target `loader`/`action`. This means that if you have 3 `loader`'s being called in parallel on a navigation or revalidation, they will _each_ run any existing root middleware. If these duplicate middleware calls are problematic then you will need to de-dup any problematic logic manually.
