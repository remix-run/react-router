---
title: NavLink
---

# `<NavLink>`

A `<NavLink>` is a special kind of `<Link>` that knows whether or not it is "active", "pending", or "transitioning". This is useful in a few different scenarios:

- When building a navigation menu, such as a breadcrumb or a set of tabs where you'd like to show which of them is currently selected
- It provides useful context for assistive technology like screen readers
- It provides a "transitioning" value to give you finer-grained control over [View Transitions][view-transitions]

```tsx
import { NavLink } from "react-router-dom";

<NavLink
  to="/messages"
  className={({ isActive, isPending }) =>
    isPending ? "pending" : isActive ? "active" : ""
  }
>
  Messages
</NavLink>;
```

## Default `active` class

By default, an `active` class is added to a `<NavLink>` component when it is active so you can use CSS to style it.

```tsx
<nav id="sidebar">
  <NavLink to="/messages" />
</nav>
```

```css
#sidebar a.active {
  color: red;
}
```

## `className`

The `className` prop works like a normal className, but you can also pass it a function to customize the classNames applied based on the active and pending state of the link.

```tsx
<NavLink
  to="/messages"
  className={({ isActive, isPending, isTransitioning }) =>
    [
      isPending ? "pending" : "",
      isActive ? "active" : "",
      isTransitioning ? "transitioning" : "",
    ].join(" ")
  }
>
  Messages
</NavLink>
```

## `style`

The `style` prop works like a normal style prop, but you can also pass it a function to customize the styles applied based on the active and pending state of the link.

```tsx
<NavLink
  to="/messages"
  style={({ isActive, isPending, isTransitioning }) => {
    return {
      fontWeight: isActive ? "bold" : "",
      color: isPending ? "red" : "black",
      viewTransitionName: isTransitioning ? "slide" : "",
    };
  }}
>
  Messages
</NavLink>
```

## `children`

You can pass a render prop as children to customize the content of the `<NavLink>` based on the active and pending state, which is useful to change styles on internal elements.

```tsx
<NavLink to="/tasks">
  {({ isActive, isPending, isTransitioning }) => (
    <span className={isActive ? "active" : ""}>Tasks</span>
  )}
</NavLink>
```

## `end`

The `end` prop changes the matching logic for the `active` and `pending` states to only match to the "end" of the NavLink's `to` path. If the URL is longer than `to`, it will no longer be considered active.

| Link                           | Current URL  | isActive |
| ------------------------------ | ------------ | -------- |
| `<NavLink to="/tasks" />`      | `/tasks`     | true     |
| `<NavLink to="/tasks" />`      | `/tasks/123` | true     |
| `<NavLink to="/tasks" end />`  | `/tasks`     | true     |
| `<NavLink to="/tasks" end />`  | `/tasks/123` | false    |
| `<NavLink to="/tasks/" end />` | `/tasks`     | false    |
| `<NavLink to="/tasks/" end />` | `/tasks/`    | true     |

**A note on links to the root route**

`<NavLink to="/">` is an exceptional case because _every_ URL matches `/`. To avoid this matching every single route by default, it effectively ignores the `end` prop and only matches when you're at the root route.

## `caseSensitive`

Adding the `caseSensitive` prop changes the matching logic to make it case sensitive.

| Link                                         | URL           | isActive |
| -------------------------------------------- | ------------- | -------- |
| `<NavLink to="/SpOnGe-bOB" />`               | `/sponge-bob` | true     |
| `<NavLink to="/SpOnGe-bOB" caseSensitive />` | `/sponge-bob` | false    |

## `aria-current`

When a `NavLink` is active it will automatically apply `<a aria-current="page">` to the underlying anchor tag. See [aria-current][aria-current] on MDN.

## `reloadDocument`

The `reloadDocument` property can be used to skip client side routing and let the browser handle the transition normally (as if it were an `<a href>`).

## `viewTransition`

The `viewTransition` prop enables a [View Transition][view-transitions] for this navigation by wrapping the final state update in `document.startViewTransition()`. By default, during the transition a `transitioning` class will be added to the `<a>` element that you can use to customize the view transition.

```css
a.transitioning p {
  view-transition-name: "image-title";
}

a.transitioning img {
  view-transition-name: "image-expand";
}
```

```jsx
<NavLink to={to} viewTransition>
  <p>Image Number {idx}</p>
  <img src={src} alt={`Img ${idx}`} />
</NavLink>
```

You may also use the `className`/`style` props or the render props passed to `children` to further customize based on the `isTransitioning` value.

```jsx
<NavLink to={to} viewTransition>
  {({ isTransitioning }) => (
    <>
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
    </>
  )}
</NavLink>
```

[aria-current]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current
[view-transitions]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
