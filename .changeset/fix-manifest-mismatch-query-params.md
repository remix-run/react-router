---
"react-router": patch
---

Fixed manifest version mismatch reload losing query parameters and hash

When React Router detects a manifest version mismatch during navigation (e.g., after a new deployment), it performs a hard reload. Previously, this reload would lose query parameters and hash from the target URL. Now the full URL including search params and hash is preserved.
