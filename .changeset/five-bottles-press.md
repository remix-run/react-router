---
"@remix-run/router": minor
---

`redirect` now accepts a `replace` option in the same way as `navigate`.

```ts
loader: () => {
  return redirect("/", { replace: true });
};
```
