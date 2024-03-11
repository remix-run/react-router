---
"@remix-run/router": minor
---

Add a new `unstable_dataStrategy` configuration option

- This option allows Data Router applications to take control over the approach for executing route loaders and actions
- The default implementation is today's behavior, to fetch all loaders in parallel, but this option allows users to implement more advanced data flows including Remix single-fetch, middleware/context APIs, automatic loader caching, and more
