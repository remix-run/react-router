---
"react-router-dom": patch
---

Do not include hash in `useFormAction()` for unspecified actions since it cannot be determined on the server and causes hydration issues
