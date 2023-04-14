---
"@remix-run/router": patch
---

Fixed a bug where fetchers were incorrectly attempting to revalidate on search params changes or routing to the same URL (using the same logic for route `loader` revalidations). However, since fetchers have a static href, they should only revalidate on `action` submissions or `router.revalidate` calls.
