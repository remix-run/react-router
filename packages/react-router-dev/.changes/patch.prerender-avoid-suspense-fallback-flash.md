Use `onAllReady` for prerender requests to avoid Suspense fallback flash

Prerendered HTML previously contained React's streaming Suspense markup (fallback content + `$RC` swap script) because the prerender request went through the streaming SSR path. This caused a visible flash of the fallback on initial paint, even when nothing actually suspended during prerendering.

The fix adds a prerender signal header so entry.server templates can use `onAllReady` during prerendering, producing complete HTML without streaming artifacts.
