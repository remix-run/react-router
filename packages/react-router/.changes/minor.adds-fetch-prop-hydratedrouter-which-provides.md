Add a `fetch` prop to `HydratedRouter`, which provides a custom fetch implementation for JavaScript-issued manifest and data requests. The function receives context identifying the operation that initiated each request and the key of any fetcher being loaded. Like other router initialization options, the implementation is captured when the singleton router is created; subsequent prop changes are ignored. Read current application state inside the function to use changing values such as auth tokens.

Browser-managed data prefetches from `<Link prefetch>`, `<NavLink prefetch>`, and `<PrefetchPageLinks>` use native `<link rel="prefetch">` elements and do not call the custom implementation. Disable prefetching when data requests require custom headers or other request transformations.

Custom `dataStrategy` implementations also receive an `initiator` identifying initialization, navigation, fetcher, revalidation, and static handler executions.
