---
"react-router": patch
---

Fix fetcher race condition where formData was cleared before new loaderData was available, causing UI flicker in optimistic updates

- Fixes issue where fetcher.formData became undefined before new loaderData was committed, causing a flicker in optimistic UI updates
- Ensures atomic update of fetcher state and loaderData during navigation completion
- Prevents UI flickering when using optimistic updates with fetchers