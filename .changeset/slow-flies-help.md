---
"@remix-run/router": minor
---

- Move `unstable_dataStrategy` from `createStaticHandler` to `staticHandler.query` so it can be request-specific for use with the `ResponseStub` approach in Remix. It's not really applicable to `queryRoute` for now since that's a singular handler call anyway so any pre-processing/post/processing could be done there manually.
- Added a new `skipLoaders` flag to `staticHandler.query` for calling only the action in Remix Single Fetch
