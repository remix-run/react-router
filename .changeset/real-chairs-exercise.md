---
"react-router": patch
---

Fix the promise returned from `useNavigate` in Framework/Data Mode so that it properly tracks the duration of `popstate` navigations (i.e., `navigate(-1)`)
