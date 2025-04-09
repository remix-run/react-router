---
"react-router": patch
---

Do not automatically add `null` to `staticHandler.query()` `context.loaderData` if routes do not have loaders

- This was a Remix v2 implementation detail inadvertently left in for React Router v7
- Now that we allow returning `undefined` from loaders, our prior check of `loaderData[routeId] !== undefined` was no longer sufficient and was changed to a `routeId in loaderData` check - these `null` values can cause issues for this new check
- ⚠️ This could be a "breaking bug fix" for you if you are doing manual SSR with `createStaticHandler()`/`<StaticRouterProvider>`, and using `context.loaderData` to control `<RouterProvider>` hydration behavior on the client
