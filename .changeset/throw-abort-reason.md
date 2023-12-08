---
"@remix-run/router": minor
---

Add `createStaticHandler` `future.v7_throwAbortReason` flag to instead throw `request.signal.reason` (defaults to a `DOMException`) when a request is aborted instead of our own custom `new Error()` with a message such as `query() call aborted`/`queryRoute() call aborted`

- Please note that `DOMException` was added in Node v17 so you will not get a `DOMException` on Node 16 and below.
