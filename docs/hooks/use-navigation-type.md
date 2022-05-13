---
title: useNavigationType
---

# `useNavigationType`

<details>
  <summary>Type declaration</summary>

```tsx
declare function useNavigationType(): NavigationType;

type NavigationType = "POP" | "PUSH" | "REPLACE";
```

</details>

This hook returns the current type of navigation or how the user came to the current page; either via a pop, push, or replace action on the history stack.
