---
"react-router": patch
---

Fixed `normalizeTo` doubling the basename when `to` already includes it (e.g., from `useFormAction()`), which caused `useFetcher().submit()` to produce a 404 when a basename was configured.
