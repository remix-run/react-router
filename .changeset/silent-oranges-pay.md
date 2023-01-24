---
"react-router": patch
"react-router-dom": patch
---

Allow using `<Link>` with absolute URLs

```tsx
<Link to="https://neworigin.com/some/path">
<Link to="//neworigin.com/some/path">
<Link to="https://www.currentorigin.com/path">
```
