---
title: NavLink
---

# NavLink

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.NavLink.html)

Wraps [Link](../components/Link) with additional props for styling active and pending states.

- Automatically applies classes to the link based on its active and pending states, see NavLinkProps.className.
- Automatically applies `aria-current="page"` to the link when the link is active. See [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) on MDN.

```tsx
import { NavLink } from "react-router";
<NavLink to="/message" />;
```

States are available through the className, style, and children render props. See [NavLinkRenderProps](../Other/NavLinkRenderProps).

```tsx
<NavLink
  to="/messages"
  className={({ isActive, isPending }) =>
    isPending ? "pending" : isActive ? "active" : ""
  }
>
  Messages
</NavLink>
```

## Props

### caseSensitive

[modes: framework, data, declarative]

Changes the matching logic to make it case-sensitive:

| Link                                         | URL           | isActive |
| -------------------------------------------- | ------------- | -------- |
| `<NavLink to="/SpOnGe-bOB" />`               | `/sponge-bob` | true     |
| `<NavLink to="/SpOnGe-bOB" caseSensitive />` | `/sponge-bob` | false    |

### children

[modes: framework, data, declarative]

Can be regular React children or a function that receives an object with the active and pending states of the link.

```tsx
<NavLink to="/tasks">
  {({ isActive }) => (
    <span className={isActive ? "active" : ""}>Tasks</span>
  )}
</NavLink>
```

### className

[modes: framework, data, declarative]

Classes are automatically applied to NavLink that correspond to the state.

```css
a.active {
  color: red;
}
a.pending {
  color: blue;
}
a.transitioning {
  view-transition-name: my-transition;
}
```

Note that `pending` is only available with Framework and Data modes.

### discover

[modes: framework]

Defines the link discovery behavior

```tsx
<Link discover="render" />
```

- **render** - default, discover the route when the link renders
- **none** - don't eagerly discover, only discover if the link is clicked

### end

[modes: framework, data, declarative]

Changes the matching logic for the `active` and `pending` states to only match to the "end" of the NavLinkProps.to. If the URL is longer, it will no longer be considered active.

| Link                          | URL          | isActive |
| ----------------------------- | ------------ | -------- |
| `<NavLink to="/tasks" />`     | `/tasks`     | true     |
| `<NavLink to="/tasks" />`     | `/tasks/123` | true     |
| `<NavLink to="/tasks" end />` | `/tasks`     | true     |
| `<NavLink to="/tasks" end />` | `/tasks/123` | false    |

`<NavLink to="/">` is an exceptional case because _every_ URL matches `/`. To avoid this matching every single route by default, it effectively ignores the `end` prop and only matches when you're at the root route.

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

### style

[modes: framework, data, declarative]

Regular React style object or a function that receives an object with the active and pending states of the link.

```tsx
<NavLink to="/tasks" style={{ color: "red" }} />
<NavLink to="/tasks" style={({ isActive, isPending }) => ({
  color:
    isActive ? "red" :
    isPending ? "blue" : "black"
})} />
```

Note that `pending` is only available with Framework and Data modes.

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
