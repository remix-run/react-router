---
"react-router": patch
---

Do not automatically add `null` to `staticHandler.query()` `loaderData` if routes do not have loaders

- This was a requirement for Remix v2 because we used `JSON.stringify()` to serialize the `loaderData` of the client and it would strip `undefined` values which would cause issues for client-side router hydration
- Therefore, we had a restriction that you could not return `undefined` from a `loader`/`action`
- We used to check `loaderData[routeId] !== undefined` to see if a given route already had any data or not
- Once we implemented Single fetch and began serializing data via `turbo-stream`, we no longer has this restriction because it can serialize `undefined` correctly
- In React Router v7, we began allowing loaders to return `undefined`
- Therefore, our check of `loaderData[routeId] !== undefined` was no longer valid and we adjusted to a check of `routeId in loaderData`
- This check can fail if we are sticking a null value in `loaderData`, so we have to remove that logic
- ⚠️ This could be a "breaking bug fix" for you if you are doing manual SSR with `createStaticHandler()`/`<StaticRouterProvider>`, and using `context.loaderData` to control `<RouterProvider>` hydration behavior on the client
