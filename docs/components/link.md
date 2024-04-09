---
title: Link
---

# `<Link>`

<docs-info>This is the web version of `<Link>`. For the React Native version, [go here][link-native].</docs-info>

<details>
  <summary>Type declaration</summary>

```tsx
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  > {
  to: To;
  preventScrollReset?: boolean;
  relative?: "route" | "path";
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  unstable_viewTransition?: boolean;
}

type To = string | Partial<Path>;

interface Path {
  pathname: string;
  search: string;
  hash: string;
}
```

</details>

A `<Link>` is an element that lets the user navigate to another page by clicking or tapping on it. In `react-router-dom`, a `<Link>` renders an accessible `<a>` element with a real `href` that points to the resource it's linking to. This means that things like right-clicking a `<Link>` work as you'd expect. You can use `<Link reloadDocument>` to skip client side routing and let the browser handle the transition normally (as if it were an `<a href>`).

```tsx
import * as React from "react";
import { Link } from "react-router-dom";

function UsersIndexPage({ users }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={user.id}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

A relative `<Link to>` value (that does not begin with `/`) resolves relative to the parent route, which means that it builds upon the URL path that was matched by the route that rendered that `<Link>`. It may contain `..` to link to routes further up the hierarchy. In these cases, `..` works exactly like the command-line `cd` function; each `..` removes one segment of the parent path.

<docs-info>`<Link to>` with a `..` behaves differently from a normal `<a href>` when the current URL ends with `/`. `<Link to>` ignores the trailing slash, and removes one URL segment for each `..`. But an `<a href>` value handles `..` differently when the current URL ends with `/` vs when it does not.</docs-info>

<docs-info>Please see the [Splat Paths][relativesplatpath] section on the `useResolvedPath` docs for a note on the behavior of the `future.v7_relativeSplatPath` future flag for relative `<Link to>` behavior within splat routes</docs-info>

## `relative`

By default, links are relative to the route hierarchy (`relative="route"`), so `..` will go up one `Route` level from the current contextual route. Occasionally, you may find that you have matching URL patterns that do not make sense to be nested, and you'd prefer to use relative _path_ routing from the current contextual route path. You can opt into this behavior with `relative="path"`:

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
  // in the current contextual route path, instead of one level in the Route
  // hierarchy
  return (
    <Link to=".." relative="path">
      Cancel
    </Link>
  );
}
```

Please note that `relative: "path"` only impacts the resolution of a relative path. It does not change the "starting" location for that relative path resolution. This resolution is always relative to the current location in the Route hierarchy (i.e., the route `Link` is rendered in).

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

## `preventScrollReset`

If you are using [`<ScrollRestoration>`][scrollrestoration], this lets you prevent the scroll position from being reset to the top of the window when the link is clicked.

```tsx
<Link to="?tab=one" preventScrollReset={true} />
```

This does not prevent the scroll position from being restored when the user comes back to the location with the back/forward buttons, it just prevents the reset when the user clicks the link.

An example when you might want this behavior is a list of tabs that manipulate the url search params that aren't at the top of the page. You wouldn't want the scroll position to jump up to the top because it might scroll the toggled content out of the viewport!

```
      ┌─────────────────────────┐
      │                         ├──┐
      │                         │  │
      │                         │  │ scrolled
      │                         │  │ out of view
      │                         │  │
      │                         │ ◄┘
    ┌─┴─────────────────────────┴─┐
    │                             ├─┐
    │                             │ │ viewport
    │   ┌─────────────────────┐   │ │
    │   │  tab   tab   tab    │   │ │
    │   ├─────────────────────┤   │ │
    │   │                     │   │ │
    │   │                     │   │ │
    │   │ content             │   │ │
    │   │                     │   │ │
    │   │                     │   │ │
    │   └─────────────────────┘   │ │
    │                             │◄┘
    └─────────────────────────────┘

```

## `replace`

The `replace` property can be used if you'd like to replace the current entry in the history stack via [`history.replaceState`][history-replace-state] instead of the default usage of [`history.pushState`][history-push-state].

## `state`

The `state` property can be used to set a stateful value for the new location which is stored inside [history state][history-state]. This value can subsequently be accessed via `useLocation()`.

```tsx
<Link to="new-path" state={{ some: "value" }} />
```

You can access this state value while on the "new-path" route:

```ts
let { state } = useLocation();
```

## `reloadDocument`

The `reloadDocument` property can be used to skip client side routing and let the browser handle the transition normally (as if it were an `<a href>`).

## `unstable_viewTransition`

The `unstable_viewTransition` prop enables a [View Transition][view-transitions] for this navigation by wrapping the final state update in `document.startViewTransition()`:

```jsx
<Link to={to} unstable_viewTransition>
  Click me
</Link>
```

If you need to apply specific styles for this view transition, you will also need to leverage the [`unstable_useViewTransitionState()`][use-view-transition-state] hook (or check out the `transitioning` class and `isTransitioning` render prop in [NavLink][navlink]):

```jsx
function ImageLink(to) {
  const isTransitioning =
    unstable_useViewTransitionState(to);
  return (
    <Link to={to} unstable_viewTransition>
      <p
        style={{
          viewTransitionName: isTransitioning
            ? "image-title"
            : "",
        }}
      >
        Image Number {idx}
      </p>
      <img
        src={src}
        alt={`Img ${idx}`}
        style={{
          viewTransitionName: isTransitioning
            ? "image-expand"
            : "",
        }}
      />
    </Link>
  );
}
```

<docs-warning>`unstable_viewTransition` only works when using a data router, see [Picking a Router][picking-a-router]</docs-warning>

<docs-warning>Please note that this API is marked unstable and may be subject to breaking changes without a major release</docs-warning>

[link-native]: ./link-native
[scrollrestoration]: ./scroll-restoration
[history-replace-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
[history-push-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
[history-state]: https://developer.mozilla.org/en-US/docs/Web/API/History/state
[use-view-transition-state]: ../hooks//use-view-transition-state
[view-transitions]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
[picking-a-router]: ../routers/picking-a-router
[navlink]: ./nav-link
[relativesplatpath]: ../hooks/use-resolved-path#splat-paths
[use-location]: ../hooks/use-location
