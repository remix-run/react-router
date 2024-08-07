---
"@react-router/architect": major
"@react-router/cloudflare": major
"@react-router/node": major
"react-router": major
---

For Remix consumers migrating to React Router, the `crypto` global from the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is now required when using cookie and session APIs. This means that the following APIs are provided from `react-router` rather than platform-specific packages:

- `createCookie`
- `createCookieSessionStorage`
- `createMemorySessionStorage`
- `createSessionStorage`

For consumers running older versions of Node, the `installGlobals` function from `@remix-run/node` has been updated to define `globalThis.crypto`, using [Node's `require('node:crypto').webcrypto` implementation.](https://nodejs.org/api/webcrypto.html)

Since platform-specific packages no longer need to implement this API, the following low-level APIs have been removed:

- `createCookieFactory`
- `createSessionStorageFactory`
- `createCookieSessionStorageFactory`
- `createMemorySessionStorageFactory`
