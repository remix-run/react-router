Add an `unstable_onPrefetch` prop to `Link` and `NavLink` that runs each time the link's `prefetch` behavior triggers

- Unlike built-in prefetching, it also runs in Data Mode, so apps can prime their own caches (for example, TanStack Query) on `intent`, `render`, or `viewport`
- In Framework Mode, it runs alongside the built-in `<link rel="prefetch">` tags
