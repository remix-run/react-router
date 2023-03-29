---
"@remix-run/router": patch
---

Decouple `AbortController` usage between revalidating fetchers and the thing that triggered them such that the unmount/deletion of a revalidating fetcher doesn't impact the ongoing triggering navigation/revalidation
