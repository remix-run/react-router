---
title: useResolvedPath
---

# `useResolvedPath`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useResolvedPath(
  to: To,
  options?: { relative?: RelativeRoutingType }
): Path;
```

</details>

This hook resolves the `pathname` of the location in the given `to` value against the pathname of the current location.

This is useful when building links from relative values. For example, check out the source to [`<NavLink>`][navlink] which calls `useResolvedPath` internally to resolve the full pathname of the page being linked to.

See [resolvePath][resolvepath] for more information.

## Splat Paths

The original logic for `useResolvedPath` behaved differently for splat paths which in hindsight was incorrect/buggy behavior. This was fixed in [`6.19.0`][release-6.19.0] but it was determined that a large number of existing applications [relied on this behavior][revert-comment] so the fix was reverted in [`6.20.1`][release-6.20.1] and re-introduced in [`6.21.0`][release-6.21.0] behind a `future.v7_relativeSplatPath` [future flag][future-flag]. This will become the default behavior in React Router v7, so it is recommended to update your applications at your convenience to be better prepared for the eventual v7 upgrade.

It should be noted that this is the foundation for all relative routing in React Router, so this applies to the following relative path code flows as well:

- `<Link to>`
- `useNavigate()`
- `useHref()`
- `<Form action>`
- `useSubmit()`
- Relative path `redirect` responses returned from loaders and actions

### Behavior without the flag

When this flag is not enabled, the default behavior is that when resolving relative paths inside of a [splat route (`*`)][splat], the splat portion of the path is ignored. So, given a route tree such as:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/dashboard/*" element={<Dashboard />} />
  </Routes>
</BrowserRouter>
```

If you are currently at URL `/dashboard/teams`, `useResolvedPath("projects")` inside the `Dashboard` component would resolve to `/dashboard/projects` because the "current" location we are relative to would be considered `/dashboard` _without the "teams" splat value_.

This makes for a slight convenience in routing between "sibling" splat routes (`/dashboard/teams`, `/dashboard/projects`, etc.), however it causes other inconsistencies such as:

- `useResolvedPath(".")` no longer resolves to the current location for that route, it actually resolved you "up" to `/dashboard` from `/dashboard/teams`
- If you changed your route definition to use a dynamic parameter (`<Route path="/dashboard/:widget">`), then any resolved paths inside the `Dashboard` component would break since the dynamic param value is not ignored like the splat value

And then it gets worse if you define the splat route as a child:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/dashboard">
      <Route path="*" element={<Dashboard />} />
    </Route>
  </Routes>
</BrowserRouter>
```

- Now, `useResolvedPath(".")` and `useResolvedPath("..")` resolve to the exact same path inside `<Dashboard />`
- If you were using a Data Router and defined an `action` on the splat route, you'd get a 405 error on `<Form>` submissions inside `<Dashboard>` because they (by default) submit to `"."` which would resolve to the parent `/dashboard` route which doesn't have an `action`.

### Behavior with the flag

When you enable the flag, this "bug" is fixed so that path resolution is consistent across all route types, and `useResolvedPath(".")` always resolves to the current pathname for the contextual route. This includes any dynamic param or splat param values.

If you want to navigate between "sibling" routes within a splat route, it is suggested you move your splat route to it's own child and use `useResolvedPath("../teams")` and `useResolvedPath("../projects")` parent-relative paths to navigate to sibling `/dashboard` routes. Note that here we also use `index` so that the URL `/dashboard` also renders the `<Dashboard>` component.

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/dashboard">
      <Route index path="*" element={<Dashboard />} />
    </Route>
  </Routes>
</BrowserRouter>
```

[navlink]: ../components/nav-link
[resolvepath]: ../utils/resolve-path
[release-6.19.0]: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v6190
[release-6.20.1]: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v6201
[release-6.21.0]: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v6210
[revert-comment]: https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329
[future-flag]: ../guides/api-development-strategy
[splat]: ../route/route#splats
