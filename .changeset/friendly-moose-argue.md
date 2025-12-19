---
"react-router": patch
---

Export `UNSAFE_createMemoryHistory` and `UNSAFE_createHashHistory` alongside `UNSAFE_createBrowserHistory` for consistency. These are not intended to be used for new apps but intended to help apps usiong `unstable_HistoryRouter` migrate from v6->v7 so they can adopt the newer APIs.
