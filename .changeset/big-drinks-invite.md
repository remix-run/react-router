---
"@react-router/dev": patch
---

Introduce a `prerender.unstable_concurrency` option, to support running the prerendering concurrently, potentially speeding up the build.

RFC https://github.com/remix-run/react-router/discussions/14080
fixes https://github.com/remix-run/react-router/issues/14383 
