---
title: Custom Node.js
---

# Deploying to a Custom Node.js Runtime

<docs-warning>
  This document is a work in progress. There's not much to see here (yet).
</docs-warning>

## Polyfilling `fetch`

React Router officially supports Active and Maintenance[^1] [Node LTS veleases][node-releases] at any given point in time. Dropping support for End of Life Node versions may be done in a React Router Minor release.

[^1] Based on timing, React Router may drop support for a Node Maintenance LTS version shortly before it goes end-of-life if it better aligns with a React Router Major SemVer release.

At the time React Router v7 was released, all versions had a usable `fetch` implementation so there is generally no need to polyfill any `fetch` APIs so long as you're on Node 22 or one of the later Node 20 releases.

- Node 22 (Active LTS) has a stable [`fetch`][node-22-fetch] implementation
- Node 20 (Maintenance LTS) has an experimental (but suitable from our testing) [`fetch`][node-20-fetch] implementation

If you do find that you need to polyfill anything, you can do so directly from the [undici] package which node uses internally.

```ts
import {
  fetch as nodeFetch,
  File as NodeFile,
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from "undici";

export function polyfillFetch() {
  global.File = NodeFile;
  global.Headers = NodeHeaders;
  global.Request = NodeRequest;
  global.Response = NodeResponse;
  global.fetch = nodeFetch;
  global.FormData = NodeFormData;
}
```

[node-releases]: https://nodejs.org/en/about/previous-releases
[node-20-fetch]: https://nodejs.org/docs/latest-v20.x/api/globals.html#fetch
[node-22-fetch]: https://nodejs.org/docs/latest-v22.x/api/globals.html#fetch
[undici]: https://github.com/nodejs/undici
