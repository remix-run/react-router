---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

- Fix bug when submitting to the current contextual route (parent route with an index child) when an `?index` param already exists from a prior submission
- Fix `useFormAction` bug - when removing `?index` param it would not keep other non-Remix `index` params
