---
"react-router": patch
---

Update Lazy Route Discovery manifest requests to use a singular comma-separated `paths` query param instead of repeated `p` query params

- This is because Cloudflare has a hard limit of 100 URL search param key/value pairs when used as a key for caching purposes
- If more that 100 paths were included, the cache key would be incomplete and could produce false-positive cache hits
