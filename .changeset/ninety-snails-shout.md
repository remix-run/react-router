---
"react-router": patch
---

Be defensive against leading double slashes in paths to avoid `Invalid URL` errors from the URL constructor

- Note we do not sanitize/normalize these paths - we only detect them so we can avoid the error that would be thrown by `new URL("//", window.location.origin)`
