---
"@remix-run/router": minor
---

Add a new `unstable_data()` API for usage with Remix Single Fetch

- This API is not intended for direct usage in React Router SPA applications
- It is primarily intended for usage with `createStaticHandler.query()` to allow loaders/actions to return arbitrary data + `status`/`headers` without forcing the serialization of data into a `Response` instance
- This allows for more advanced serialization tactics via `unstable_dataStrategy` such as serializing via `turbo-stream` in Remix Single Fetch
