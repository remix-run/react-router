---
"@react-router/serve": patch
"@react-router/dev": patch
"react-router": patch
---

- Fix `react-router-serve` handling of prerendered HTML files by removing the `redirect: false` option so it now falls back on the default `redirect: true` behavior of redirecting from `/folder` -> `/folder/` which will then pick up `/folder/index.html` from disk. See https://expressjs.com/en/resources/middleware/serve-static.html
- Proxy prerendered loader data into prerender pass for HTML files to avoid double-invocations of the loader at build time
