---
title: useInRouterContext
---

# `useInRouterContext`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useInRouterContext(): boolean;
```

</details>

The `useInRouterContext` hooks returns `true` if the component is being rendered in the context of a `<Router>`, `false` otherwise. This can be useful for some 3rd-party extensions that need to know if they are being rendered in the context of a React Router app.
