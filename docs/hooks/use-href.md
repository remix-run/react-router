---
title: useHref
---

# `useHref`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useHref(to: To): string;
```

</details>

The `useHref` hook returns a URL that may be used to link to the given `to` location, even outside of React Router.

> **Tip:**
>
> You may be interested in taking a look at the source for the [`<Link>`](https://github.com/remix-run/react-router/blob/334589beb3aeedb48ea2f3f05c14b48c5d439b2f/packages/react-router-dom/index.tsx#L270)
> component in `react-router-dom` to see how it uses `useHref` internally to
> determine its own `href` value.
