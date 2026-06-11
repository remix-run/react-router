Expose `isPrerender` on `EntryContext` to support fallback-free prerendered HTML

Adds `isPrerender: boolean` to the `EntryContext` interface so entry.server templates can detect prerender requests and use `onAllReady` (or `await body.allReady`) to avoid shipping Suspense fallback + `$RC` swap scripts in prerendered HTML.
