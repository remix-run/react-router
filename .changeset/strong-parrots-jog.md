---
"react-router": patch
---

Fix a regression in `createRoutesStub` introduced with the middleware feature.

As part of that work we altered the signature to align with the new middleware APIs without making it backwards compatible with the prior `AppLoadContext` API. This permitted `createRoutesStub` to work if you were opting into middleware and the updated `context` typings, but broke `createRoutesStub` for users not yet opting into middleware.

We've reverted this change and re-implemented it in such a way that both sets of users can leverage it.

```tsx
// If you have not opted into middleware, the old API should work again
let context: AppLoadContext = {
  /*...*/
};
let Stub = createRoutesStub(routes, context);

// If you have opted into middleware, you should now pass an instantiated `unstable_routerContextProvider` instead of a `getContext` factory function.
let context = new unstable_RouterContextProvider();
context.set(SomeContext, someValue);
let Stub = createRoutesStub(routes, context);
```

⚠️ This may be a breaking bug for if you have adopted the unstable Middleware feature and are using `createRoutesStub` with the updated API.
