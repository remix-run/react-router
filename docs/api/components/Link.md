---
title: Link
---

# Link

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.Link.html)

A progressively enhanced `<a href>` wrapper to enable navigation with client-side routing.

```tsx
import { Link } from "react-router";

<Link to="/dashboard">Dashboard</Link>;

<Link
  to={{
    pathname: "/some/path",
    search: "?query=string",
    hash: "#hash",
  }}
/>;
```

## Props

### discover

[modes: framework]

Defines the link discovery behavior

```tsx
<Link discover="render" />
```

- **render** - default, discover the route when the link renders
- **none** - don't eagerly discover, only discover if the link is clicked

### prefetch

[modes: framework]

Defines the data and module prefetching behavior for the link.

```tsx
<Link prefetch="intent" />
```

- **none** - default, no prefetching
- **intent** - prefetches when the user hovers or focuses the link
- **render** - prefetches when the link renders
- **viewport** - prefetches when the link is in the viewport, very useful for mobile

Prefetching is done with HTML `<link rel="prefetch">` tags. They are inserted after the link.

```tsx
<a href="..." />
<a href="..." />
<link rel="prefetch" /> // might conditionally render
```

Because of this, if you are using `nav :last-child` you will need to use `nav :last-of-type` so the styles don't conditionally fall off your last link (and any other similar selectors).

### preventScrollReset

[modes: framework, data]

Prevents the scroll position from being reset to the top of the window when the link is clicked and the app is using [ScrollRestoration](../components/ScrollRestoration). This only prevents new locations reseting scroll to the top, scroll position will be restored for back/forward button navigation.

```tsx
<Link to="?tab=one" preventScrollReset />
```

### relative

[modes: framework, data, declarative]

Defines the relative path behavior for the link.

```tsx
<Link to=".." /> // default: "route"
<Link relative="route" />
<Link relative="path" />
```

Consider a route hierarchy where a parent route pattern is "blog" and a child route pattern is "blog/:slug/edit".

- **route** - default, resolves the link relative to the route pattern. In the example above a relative link of `".."` will remove both `:slug/edit` segments back to "/blog".
- **path** - relative to the path so `..` will only remove one URL segment up to "/blog/:slug"

### reloadDocument

[modes: framework, data, declarative]

Will use document navigation instead of client side routing when the link is clicked: the browser will handle the transition normally (as if it were an `<a href>`).

```tsx
<Link to="/logout" reloadDocument />
```

### replace

[modes: framework, data, declarative]

Replaces the current entry in the history stack instead of pushing a new one onto it.

```tsx
<Link replace />
```

```
# with a history stack like this
A -> B

# normal link click pushes a new entry
A -> B -> C

# but with `replace`, B is replaced by C
A -> C
```

### state

[modes: framework, data, declarative]

Adds persistent client side routing state to the next location.

```tsx
<Link to="/somewhere/else" state={{ some: "value" }} />
```

The location state is accessed from the `location`.

```tsx
function SomeComp() {
  const location = useLocation();
  location.state; // { some: "value" }
}
```

This state is inaccessible on the server as it is implemented on top of [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state)

### to

[modes: framework, data, declarative]

Can be a string or a partial [Path](../Other/Path):

```tsx
<Link to="/some/path" />

<Link
  to={{
    pathname: "/some/path",
    search: "?query=string",
    hash: "#hash",
  }}
/>
```

### viewTransition

[modes: framework, data, declarative]

Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) for this navigation.

```jsx
<Link to={to} viewTransition>
  Click me
</Link>
```

To apply specific styles for the transition, see [useViewTransitionState](../hooks/useViewTransitionState)
