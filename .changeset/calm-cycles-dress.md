---
"react-router": patch
---

Do not rely on `symbol` for filtering out `redirect` responses from loader data

Previously, some projects were getting type checking errors like:

```ts
error TS4058: Return type of exported function has or is using name 'redirectSymbol' from external module "node_modules/..." but cannot be named.
```

Now that `symbol`s are not used for the `redirect` response type, these errors should no longer be present.
