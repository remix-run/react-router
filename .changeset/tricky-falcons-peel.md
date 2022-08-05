---
"react-router": patch
"react-router-dom": patch
"@remix-run/router": patch
---

SSR Updates for React Router

_Note: The Data-Router SSR aspects of `@remix-run/router` and `react-router-dom` are being released as **unstable** in this release (`unstable_createStaticHandler` and `unstable_DataStaticRouter`), and we plan to finalize them in a subsequent minor release once the kinks can be worked out with the Remix integration. To that end, they are available for use, but are subject to breaking changes in the next minor release._

- Remove `useRenderDataRouter()` in favor of `<DataRouterProvider>`/`<DataRouter>`
- Support automatic hydration in `<DataStaticRouter>`/`<DataBrowserRouter>`/`<DataHashRouter>`
  - Uses `window.__staticRouterHydrationData`
  - Can be disabled on the server via `<DataStaticRouter hydrate={false}>`
  - Can be disabled (or overridden) in the browser by passing `hydrationData` to `<DataBrowserRouter>`/`<DataHashRouter>`
- `<DataStaticRouter>` now tracks it's own SSR error boundaries on `StaticHandlerContext`
- `StaticHandlerContext` now exposes `statusCode`/`loaderHeaders`/`actionHeaders`
- `foundMissingHydrationData` check removed since Remix routes may have loaders (for modules) that don't return data for `loaderData`
