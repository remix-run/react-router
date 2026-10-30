Add `unstable_useElementScrollRestoration(selector)` to restore multiple independent scroll containers alongside window scrolling

The hook supports standalone Data Mode and Framework SPA applications and shares the root `<ScrollRestoration>` configuration when present. SSR applications restore saved selectors before hydration through the root script. Restoration makes one attempt per navigation or container mount, without retries as content grows.

Also normalize custom root keys once for basename-prefixed locations during SSR restoration and page-exit persistence, including routes that repeat the basename prefix.
