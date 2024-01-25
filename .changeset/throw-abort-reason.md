---
"@remix-run/router": minor
---

Add a `createStaticHandler` `future.v7_throwAbortReason` flag to throw `request.signal.reason` (defaults to a `DOMException`) when a request is aborted instead of an `Error` such as `new Error("query() call aborted: GET /path")`

- Please note that `DOMException` was added in Node v17 so you will not get a `DOMException` on Node 16 and below.
