---
"react-router": patch
---

Pass a copy of `searchParams` to the `setSearchParams` callback function to avoid muations of the internal `searchParams` instance. This was an issue when navigations were blocked because the internal instance be out of sync with `useLocation().search`.
