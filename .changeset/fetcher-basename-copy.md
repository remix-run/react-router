---
"react-router-dom": minor
"@remix-run/router": minor
---

Support relative routing and `basename` in `useFetcher`. Note that this introduces a new `future.v7_prependBasename` flag to the `@remix-run/router`, so if you are writing code using the router directly you may need to enable this flag to opt-into this change.
