---
"@remix-run/router": patch
"react-router-dom": patch
---

Call `window.history.pushState/replaceState` before updating React Router state (instead of after) so that `window.location` matches `useLocation` during synchronous React 17 rendering. However, generally apps should not be relying on `window.location` and should always reference `useLocation` when possible, as `window.location` will not be in sync 100% of the time (due to `popstate` events, concurrent mode, etc.)
