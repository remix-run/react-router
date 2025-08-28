---
"@react-router/cloudflare": minor
"@react-router/architect": minor
"@react-router/express": minor
"@react-router/node": minor
"@react-router/dev": minor
"react-router": minor
---

Stabilize middleware and context APIs.

We have removed the `unstable_` prefix from the following APIs and they are considered stable and ready for production use:

- [`RouterContextProvider`](https://reactrouter.com/api/utils/RouterContextProvider)
- [`createContext`](https://reactrouter.com/api/utils/createContext)
- `createBrowserRouter` [`getContext`](https://reactrouter.com/api/data-routers/createBrowserRouter#optsgetcontext) option
- `<HydratedRouter>` [`getContext`](https://reactrouter.com/api/framework-routers/HydratedRouter#getcontext) prop

Please see the [Middleware Docs](https://reactrouter.com/how-to/middleware), the [Middleware RFC](https://github.com/remix-run/remix/discussions/7642), and the [Client-side Context RFC](https://github.com/remix-run/react-router/discussions/9856) for more information.
