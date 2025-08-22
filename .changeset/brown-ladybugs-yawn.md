---
"react-router": patch
---

[UNSTABLE] Remove Data Mode `future.unstable_middleware` flag from `createBrowserRouter`

- This is only needed as a Framework Mode flag because of the route modules and the `getLoadContext` type behavior change
- In Data Mode, it's an opt-in feature because it's just a new property on a route object, so there's no behavior changes that necessitate a flag
