---
"react-router": patch
---

Add `context` support to client side data routers (unstable)

Your application `loader` and `action` functionsopn the client will now receive a `context` parameter. This is an instance of `ContextProvider` that you use with type-safe contexts (similar to `React.createContext`) and is most useful with the corresponding `middleware`/`clientMiddleware` API's:

```ts
import { unstable_createContext } from "react-router";

type User = {
  /*...*/
};

let userContext = unstable_createContext<User>();

function sessionMiddleware({ context }) {
  let user = await getUser();
  context.set(userContext, user);
}

// ... then in some downstream loader
function loader({ context }) {
  let user = context.get(userContext);
  let profile = await getProfile(user.id);
  return { profile };
}
```

Similar to server-side requests, a fresh `context` will be created per navigation (or `fetcher` call). If you have initial data you'd like to populate in the context for every request, you can provide an `unstable_getContext` function at the root oy your app:

- Library mode - `createBrowserRouter(routes, { unstable_getContext })`
- Framework mode - `<HydratedRouter unstable_getContext>`

This function should return an instance of `unstable_InitialContext` which is a `Map` of context's and initial values:

```ts
const loggerContext = unstable_createContext<(...args: unknown[]) => void>();

function logger(...args: unknown[]) {
  console.log(new Date.toISOString(), ...args);
}

function unstable_getContext() {
  return new Map([[loggerContext, logger]]);
}
```
