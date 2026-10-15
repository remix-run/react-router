Add an `unstable_fetch` prop to `<HydratedRouter>` to customize JavaScript-issued manifest and server data requests in conventional Framework Mode

- The function receives the intended request as well as context identifying the type of request
- Data request context includes `navigationType` (`"PUSH"`, `"REPLACE"`, or `"POP"` for navigation-initiated requests, including reloaded fetchers; `null` otherwise)
  - Data strategies receive equivalent metadata through `unstable_initiator` and `unstable_navigationType`
- The custom fetch context is a discriminated union, so narrowing `type` to `"navigation"` guarantees a non-null `navigationType`, while other data requests have a `null` `navigationType`
  - Fetchers reloaded after an initialization redirect retain the `"initialization"` type and include their fetcher key
- Like other router initialization options, the implementation is captured when the singleton router is created and thus subsequent prop changes are ignored
- Browser-managed data prefetches from `<Link prefetch>` use native `<link rel="prefetch">` elements and do not call the custom implementation
- Use the callback for custom fetch options, custom headers, safe request retries, or response header inspection
- Return response bodies unchanged so React Router can decode its manifest and Turbo Stream data protocols
