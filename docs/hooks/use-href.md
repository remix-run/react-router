---
title: useHref
---

# `useHref`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useHref(
  to: To,
  options?: { relative?: RelativeRoutingType }
): string;
```

</details>

The `useHref` hook returns a URL that may be used to link to the given `to` location, even outside of React Router.

> **Tip:**
>
> You may be interested in taking a look at the source for the `<Link>`
> component in `react-router-dom` to see how it uses `useHref` internally to
> determine its own `href` value.
