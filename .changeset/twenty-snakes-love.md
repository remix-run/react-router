---
"react-router": patch
---

Short circuit post-processing on aborted `dataStrategy` requests

- This resolves non-user-facing console errors of the form `Cannot read properties of undefined (reading 'result')`
