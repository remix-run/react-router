---
title: NavLink
---

# NavLink

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/dom/lib.tsx
-->

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.NavLink.html)

Wraps [`<Link>`](../components/Link) with additional props for styling active and
pending states.

- Automatically applies classes to the link based on its `active` and `pending`
states, see [`NavLinkProps.className`](https://api.reactrouter.com/v7/interfaces/react_router.NavLinkProps.html#className)
  - Note that `pending` is only available with Framework and Data modes.
- Automatically applies `aria-current="page"` to the link when the link is active.
See [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
on MDN.
- States are additionally available through the className, style, and children
render props. See [`NavLinkRenderProps`](https://api.reactrouter.com/v7/types/react_router.NavLinkRenderProps.html).

```tsx
<NavLink to="/message">Messages</NavLink>

// Using render props
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

Can be regular React children or a function that receives an object with the
`active` and `pending` states of the link.

 ```tsx
 <NavLink to="/tasks">
   {({ isActive }) => (
     <span className={isActive ? "active" : ""}>Tasks</span>
   )}
 </NavLink>
 ```

### className

[modes: framework, data, declarative]

Classes are automatically applied to `NavLink` that correspond to the state.

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

Or you can specify a function that receives [`NavLinkRenderProps`](https://api.reactrouter.com/v7/types/react_router.NavLinkRenderProps.html) and
returns the `className`:

```tsx
<NavLink className={({ isActive, isPending }) => (
  isActive ? "my-active-class" :
  isPending ? "my-pending-class" :
  ""
)} />
```

### discover

[modes: framework]

Defines the link [lazy route discovery](../../explanation/lazy-route-discovery) behavior.

- **render** — default, discover the route when the link renders
- **none** — don't eagerly discover, only discover if the link is clicked

```tsx
<Link /> // default ("render")
<Link discover="render" />
<Link discover="none" />
```

### end

[modes: framework, data, declarative]

Changes the matching logic for the `active` and `pending` states to only match
to the "end" of the [`NavLinkProps.to`](https://api.reactrouter.com/v7/interfaces/react_router.NavLinkProps.html#to). If the URL is longer, it will no
longer be considered active.

| Link                          | URL          | isActive |
| ----------------------------- | ------------ | -------- |
| `<NavLink to="/tasks" />`     | `/tasks`     | true     |
| `<NavLink to="/tasks" />`     | `/tasks/123` | true     |
| `<NavLink to="/tasks" end />` | `/tasks`     | true     |
| `<NavLink to="/tasks" end />` | `/tasks/123` | false    |

`<NavLink to="/">` is an exceptional case because _every_ URL matches `/`.
To avoid this matching every single route by default, it effectively ignores
the `end` prop and only matches when you're at the root route.

### prefetch

[modes: framework]

Defines the data and module prefetching behavior for the link.

```tsx
<Link /> // default
<Link prefetch="none" />
<Link prefetch="intent" />
<Link prefetch="render" />
<Link prefetch="viewport" />
```

- **none** — default, no prefetching
- **intent** — prefetches when the user hovers or focuses the link
- **render** — prefetches when the link renders
- **viewport** — prefetches when the link is in the viewport, very useful for mobile

Prefetching is done with HTML [`<link rel="prefetch">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
tags. They are inserted after the link.

```tsx
<a href="..." />
<a href="..." />
<link rel="prefetch" /> // might conditionally render
```

Because of this, if you are using `nav :last-child` you will need to use
`nav :last-of-type` so the styles don't conditionally fall off your last link
(and any other similar selectors).

### preventScrollReset

[modes: framework, data]

Prevents the scroll position from being reset to the top of the window when
the link is clicked and the app is using [`ScrollRestoration`](../components/ScrollRestoration). This only
prevents new locations resetting scroll to the top, scroll position will be
restored for back/forward button navigation.

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

Consider a route hierarchy where a parent route pattern is `"blog"` and a child
route pattern is `"blog/:slug/edit"`.

- **route** — default, resolves the link relative to the route pattern. In the
example above, a relative link of `"..."` will remove both `:slug/edit` segments
back to `"/blog"`.
- **path** — relative to the path so `"..."` will only remove one URL segment up
to `"/blog/:slug"`

Note that index routes and layout routes do not have paths so they are not
included in the relative path calculation.

### reloadDocument

[modes: framework, data, declarative]

Will use document navigation instead of client side routing when the link is
clicked: the browser will handle the transition normally (as if it were an
[`<a href>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)).

```tsx
<Link to="/logout" reloadDocument />
```

### replace

[modes: framework, data, declarative]

Replaces the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
stack instead of pushing a new one onto it.

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

This state is inaccessible on the server as it is implemented on top of
[`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state)

### style

[modes: framework, data, declarative]

Styles can also be applied dynamically via a function that receives
[`NavLinkRenderProps`](https://api.reactrouter.com/v7/types/react_router.NavLinkRenderProps.html) and returns the styles:

```tsx
<NavLink to="/tasks" style={{ color: "red" }} />
<NavLink to="/tasks" style={({ isActive, isPending }) => ({
  color:
    isActive ? "red" :
    isPending ? "blue" : "black"
})} />
```

### to

[modes: framework, data, declarative]

Can be a string or a partial [`Path`](https://api.reactrouter.com/v7/interfaces/react_router.Path.html):

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

[modes: framework, data]

Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
for this navigation.

```jsx
<Link to={to} viewTransition>
  Click me
</Link>
```

To apply specific styles for the transition, see [`useViewTransitionState`](../hooks/useViewTransitionState)

