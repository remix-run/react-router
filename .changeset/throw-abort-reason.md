---
"@remix-run/router": minor
---

Add `createStaticHandler` `future.v7_throwAbortReason` flag to instead throw `request.signal.reason` when a request is aborted instead of our own custom `new Error()` with a message such as `query() call aborted`/`queryRoute() call aborted`.
