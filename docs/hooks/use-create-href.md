---
title: useCreateHref
---

# `useCreateHref`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useCreateHref(): (
  to: To,
  options?: { relative?: RelativeRoutingType }
): string;
```

</details>

The `useCreateHref` hook returns function which will return a URL when called that may be used to link to the given `to` location, even outside of React Router.

> **Tip:**
>
> You may be interested in taking a look at the source for the `useHref`
> component in `react-router` to see how it uses `useCreateHref` internally.
