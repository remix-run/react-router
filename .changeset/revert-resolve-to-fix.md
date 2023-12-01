---
"react-router-dom": patch
"react-router": patch
"@remix-run/router": patch
---

Revert the `useResolvedPath` fix for splat routes due to a large number of applications that were relying on the buggy behavior (see https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329). We plan to re-introduce this fix behind a future flag in the next minor version.
