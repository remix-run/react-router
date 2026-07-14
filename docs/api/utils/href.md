---
title: href
---

# href

[MODES: framework]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.href.html)

Returns a resolved URL path for the specified route.

```tsx
const h = href("/:lang?/about", { lang: "en" })
// -> `/en/about`

<Link to={href("/products/:id", { id: "abc123" })} />
```
