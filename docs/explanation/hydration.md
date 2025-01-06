---
title: Hydration
hidden: true
---

There are a few nuances worth noting around the behavior of `HydrateFallback`:

- It is only relevant on initial document request and hydration, and will not be rendered on any subsequent client-side navigations
- It is only relevant when you are also setting [`clientLoader.hydrate=true`][hydrate-true] on a given route
- It is also relevant if you do have a `clientLoader` without a server `loader`, as this implies `clientLoader.hydrate=true` since there is otherwise no loader data at all to return from `useLoaderData`
  - Even if you do not specify a `HydrateFallback` in this case, React Router will not render your route component and will bubble up to any ancestor `HydrateFallback` component
  - This is to ensure that `useLoaderData` remains "happy-path"
  - Without a server `loader`, `useLoaderData` would return `undefined` in any rendered route components
- You cannot render an `<Outlet/>` in a `HydrateFallback` because children routes can't be guaranteed to operate correctly since their ancestor loader data may not yet be available if they are running `clientLoader` functions on hydration (i.e., use cases such as `useRouteLoaderData()` or `useMatches()`)
