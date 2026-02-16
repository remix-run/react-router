---
"@remix-run/react-router": patch
"react-router": patch
"react-router-dom": patch
---

Fixed an issue where multiple concurrent `useFetcher()` submissions would collapse into a single effective inflight fetcher on routes that use deferred loaders with Suspense/Await. Fetchers now maintain their independent states during deferred revalidation cycles, ensuring consistent behavior between blocking and deferred routes.