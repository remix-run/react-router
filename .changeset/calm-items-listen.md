---
"react-router": patch
"@remix-run/router": patch
---

`useLocation` hook now accepts a state as generic.

So, you are able to define

```ts
const location = useLocation<{from?: string}>();

console.log(location.state?.from) // string | null | undefined
```
