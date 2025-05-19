---
"react-router": patch
---

href replaces splats `*`

```ts
const a = href("/products/*", { "*": "/1/edit" });
// -> /products/1/edit
```
