---
"@react-router/dev": patch
---

Fix `href` for optional segments

Type generation now expands paths with optionals into their corresponding non-optional paths.
For example, the path `/user/:id?` gets expanded into `/user` and `/user/:id` to more closely model visitable URLs.
`href` then uses these expanded (non-optional) paths to construct type-safe paths for your app:

```ts
// original: /user/:id?
// expanded: /user & /user/:id
href("/user"); // ✅
href("/user/:id", { id: 1 }); // ✅
```

This becomes even more important for static optional paths where there wasn't a good way to indicate whether the optional should be included in the resulting path:

```ts
// original: /products/:id/detail?

// before
href("/products/:id/detail?"); // ❌ How can we tell `href` to include or omit `detail?` segment with a complex API?

// now
// expanded: /products/:id & /products/:id/detail
href("/product/:id"); // ✅
href("/product/:id/detail"); // ✅
```
