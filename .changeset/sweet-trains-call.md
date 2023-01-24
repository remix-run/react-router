---
"react-router-dom": minor
---

Support absolute URLs in `<Link to>`. If the URL is for the current origin, it will still do a client-side navigation. If the URL is for a different origin then it will do a fresh document request for the new origin. ([#9900](https://github.com/remix-run/react-router/pull/9900))

```tsx
<Link to="https://neworigin.com/some/path">
<Link to="//neworigin.com/some/path">
<Link to="https://www.currentorigin.com/path">
```
