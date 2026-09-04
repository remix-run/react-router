---
title: Revalidation Optimization
---

# Revalidation Optimization

[MODES: framework, data]

<br/>
<br/>

After a mutation or some navigations, React Router re-runs loaders so
the UI stays in sync with the server. That default is the right
starting point. When a loader is expensive, or a mutation cannot
affect that route's data, you can skip the reload.

<docs-warning>
Skipping revalidation can leave the UI out of sync with the server.
Prefer targeting a specific action or navigation, and fall back to
`defaultShouldRevalidate` instead of always returning `false`.
</docs-warning>

## Default behavior

**Framework Mode with SSR** revalidates every matched loader after
navigations and after [`<Form>`][form], [`useSubmit`][use-submit],
`<fetcher.Form>`, and `fetcher.submit`. That includes the root
route. This is different from [Data Mode][data-mode].

**Data Mode** already skips some loaders on navigations (for example
a parent whose params did not change). It still revalidates after
an action that returns a non-error status, when search params
change, when the route's own params change, and when navigating to
the same URL.

Each matched route is decided independently. A child that skips
revalidation does not skip its parent or `root`. After
`fetcher.submit()`, a leaf `shouldRevalidate` that returns `false`
still leaves the root loader free to run.

[`fetcher.load`][use-fetcher] only revalidates by default after
action submissions and explicit [`useRevalidator`][use-revalidator]
calls, not on search-param or param-driven navigations.

A plain `fetch()` to a [resource route][resource-routes] does not
go through the router, so it does not revalidate loaders.

## Skip a route with `shouldRevalidate`

Export `shouldRevalidate` from the [route module][route-module]
(Framework Mode) or set it on the [route object][data-mode]
(Data Mode). Returning `false` skips **that route's** loader.

```tsx filename=app/routes/dashboard.tsx
export function shouldRevalidate() {
  return false;
}
```

```tsx
createBrowserRouter([
  {
    path: "/dashboard",
    loader: dashboardLoader,
    shouldRevalidate: () => false,
    Component: Dashboard,
  },
]);
```

Always returning `false` opts that route out of the default
behavior completely, including cases you usually still want
(param changes, explicit [`useRevalidator`][use-revalidator]).
Prefer the conditional form below.

## Opt out of specific requests

Inspect
[`ShouldRevalidateFunctionArgs`][should-revalidate-args]
and return `defaultShouldRevalidate` for everything else.

```tsx
import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidate({
  formMethod,
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (
    formMethod === "POST" &&
    formAction?.endsWith("/analytics")
  ) {
    return false;
  }

  return defaultShouldRevalidate;
}
```

Other useful fields:

- `formData`, `json`, `text` — the submission body
- `actionResult`, `actionStatus` — the action's return value
- `currentUrl`, `nextUrl`, `currentParams`, `nextParams` —
  the navigation

You can ignore search-param-only updates while still
revalidating when the pathname changes:

```tsx
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (currentUrl.pathname === nextUrl.pathname) {
    return false;
  }

  return defaultShouldRevalidate;
}
```

## Skip revalidation for one event

Pass `defaultShouldRevalidate={false}` at the call site so you
do not have to change every route file. This works on
[`<Form>`][form], [`<Link>`][link], `<fetcher.Form>`, and as an
option to [`useSubmit`][use-submit], `fetcher.submit`,
[`useNavigate`][use-navigate], and
[`useSearchParams`][use-search-params].

```tsx
import { Form, Link } from "react-router";

<Link
  to="/search?q=shoes"
  defaultShouldRevalidate={false}
>
  Search Shoes
</Link>

<Form
  method="post"
  action="/analytics"
  defaultShouldRevalidate={false}
>
  <button>Track Click</button>
</Form>
```

```tsx
fetcher.submit(
  { intent: "save-progress" },
  {
    method: "post",
    action: "/save-progress",
    defaultShouldRevalidate: false,
  },
);
```

If a matched route does **not** export `shouldRevalidate`, this
value is used directly for that loader. If it **does** export
`shouldRevalidate`, the value is passed in as
`defaultShouldRevalidate` and the route still has the final say.

That is why a child `shouldRevalidate` that always returns
`false` cannot hide a root reload after `fetcher.submit`. Either
also opt `root` out for that case, or pass
`defaultShouldRevalidate: false` at the call site when `root`
has no `shouldRevalidate` of its own.

[data-mode]: ../start/data/route-object#shouldrevalidate
[form]: ../api/components/Form
[link]: ../api/components/Link
[resource-routes]: ./resource-routes
[route-module]: ../start/framework/route-module#shouldrevalidate
[should-revalidate-args]: https://api.reactrouter.com/v8/interfaces/react-router.ShouldRevalidateFunctionArgs.html
[use-fetcher]: ../api/hooks/useFetcher
[use-navigate]: ../api/hooks/useNavigate
[use-revalidator]: ../api/hooks/useRevalidator
[use-search-params]: ../api/hooks/useSearchParams
[use-submit]: ../api/hooks/useSubmit
