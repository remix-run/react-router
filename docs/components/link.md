---
title: Link
---

# `<Link>`

> **Note:**
>
> This is the web version of `<Link>`. For the React Native version,
> [go here][link-native].

<details>
  <summary>Type declaration</summary>

```tsx
declare function Link(props: LinkProps): React.ReactElement;

interface LinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  > {
  replace?: boolean;
  state?: any;
  to: To;
  reloadDocument?: boolean;
}

type To = Partial<Location> | string;
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

> **Note:**
>
> `<Link to>` with a `..` behaves differently from a normal `<a href>` when the
> current URL ends with `/`. `<Link to>` ignores the trailing slash, and removes
> one URL segment for each `..`. But an `<a href>` value handles `..`
> differently when the current URL ends with `/` vs when it does not.

[link-native]: ./link-native

## `resetScroll`

If you are using [`<ScrollRestoration>`][scrollrestoration], this lets you prevent the scroll position from being reset to the top of the window when the link is clicked.

```tsx
<Link to="?tab=one" resetScroll={false} />
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

[scrollrestoration]: ./scroll-restoration
