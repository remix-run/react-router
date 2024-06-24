---
title: useNavigate
---

# `useNavigate`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigate(): NavigateFunction;

interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

interface NavigateOptions {
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
  relative?: RelativeRoutingType;
  unstable_flushSync?: boolean;
  unstable_viewTransition?: boolean;
}

type RelativeRoutingType = "route" | "path";
```

</details>

<docs-warning>It's usually better to use [`redirect`][redirect] in [`loaders`][loaders] and [`actions`][actions] than this hook</docs-warning>

The `useNavigate` hook returns a function that lets you navigate programmatically, for example in an effect:

```tsx
import { useNavigate } from "react-router-dom";

function useLogoutTimer() {
  const userIsInactive = useFakeInactiveUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (userIsInactive) {
      fake.logout();
      navigate("/session-timed-out");
    }
  }, [userIsInactive]);
}
```

The `navigate` function has two signatures:

- Either pass a `To` value (same type as `<Link to>`) with an optional second `options` argument (similar to the props you can pass to [`<Link>`][link]), or
- Pass the delta you want to go in the history stack. For example, `navigate(-1)` is equivalent to hitting the back button

<docs-info>Please see the [Splat Paths][relativesplatpath] section on the `useResolvedPath` docs for a note on the behavior of the `future.v7_relativeSplatPath` future flag for relative `useNavigate()` behavior within splat routes</docs-info>

## `options.replace`

Specifying `replace: true` will cause the navigation to replace the current entry in the history stack instead of adding a new one.

## `options.state`

You may include an optional `state` value to store in [history state][history-state], which you can then access on the destination route via [`useLocation`][use-location]. For example:

```tsx
navigate("/new-route", { state: { key: "value" } });
```

## `options.preventScrollReset`

When using the [`<ScrollRestoration>`][scrollrestoration] component, you can disable resetting the scroll to the top of the page via `options.preventScrollReset`

## `options.relative`

By default, navigation is relative to the route hierarchy (`relative: "route"`), so `..` will go up one `Route` level. Occasionally, you may find that you have matching URL patterns that do not make sense to be nested, and you'd prefer to use relative _path_ routing. You can opt into this behavior with `relative: "path"`:

```jsx
// Contact and EditContact do not share additional UI layout
<Route path="/" element={<Layout />}>
  <Route path="contacts/:id" element={<Contact />} />
  <Route
    path="contacts/:id/edit"
    element={<EditContact />}
  />
</Route>;

function EditContact() {
  // Since Contact is not a parent of EditContact we need to go up one level
  // in the path, instead of one level in the Route hierarchy
  navigate("..", { relative: "path" });
}
```

Please note that `relative: "path"` only impacts the resolution of a relative path. It does not change the "starting" location for that relative path resolution. This resolution is always relative to the current location in the Route hierarchy (i.e., the route `useNavigate` is called in).

If you wish to use path-relative routing against the current URL instead of the route hierarchy, you can do that with the current [`location`][use-location] and the `URL` constructor (note the trailing slash behavior):

```js
// Assume the current URL is https://remix.run/docs/en/main/start/quickstart
let location = useLocation();

// Without trailing slashes
new URL(".", window.origin + location.pathname);
// 'https://remix.run/docs/en/main/start/'
new URL("..", window.origin + location.pathname);
// 'https://remix.run/docs/en/main/'

// With trailing slashes:
new URL(".", window.origin + location.pathname + "/");
// 'https://remix.run/docs/en/main/start/quickstart/'
new URL("..", window.origin + location.pathname + "/");
// 'https://remix.run/docs/en/main/start/'
```

## `options.unstable_flushSync`

The `unstable_flushSync` option tells React Router DOM to wrap the initial state update for this navigation in a [`ReactDOM.flushSync`][flush-sync] call instead of the default [`React.startTransition`][start-transition]. This allows you to perform synchronous DOM actions immediately after the update is flushed to the DOM.

<docs-warning>`unstable_flushSync` only works when using a data router, see [Picking a Router][picking-a-router]</docs-warning>

<docs-warning>Please note that this API is marked unstable and may be subject to breaking changes without a major release</docs-warning>

## `options.unstable_viewTransition`

The `unstable_viewTransition` option enables a [View Transition][view-transitions] for this navigation by wrapping the final state update in `document.startViewTransition()`. If you need to apply specific styles for this view transition, you will also need to leverage the [`unstable_useViewTransitionState()`][use-view-transition-state].

<docs-warning>`unstable_viewTransition` only works when using a data router, see [Picking a Router][picking-a-router]</docs-warning>

<docs-warning>Please note that this API is marked unstable and may be subject to breaking changes without a major release</docs-warning>

[link]: ../components/link
[redirect]: ../fetch/redirect
[loaders]: ../route/loader
[actions]: ../route/action
[history-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/state
[scrollrestoration]: ../components/scroll-restoration
[use-location]: ../hooks/use-location
[use-view-transition-state]: ../hooks//use-view-transition-state
[view-transitions]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
[picking-a-router]: ../routers/picking-a-router
[flush-sync]: https://react.dev/reference/react-dom/flushSync
[start-transition]: https://react.dev/reference/react/startTransition
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
