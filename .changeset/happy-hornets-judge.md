---
"react-router": patch
---

Do not try to use `turbo-stream` to decode CDN errors that never reached the server

- We used to do this but lost this check with the adoption of single fetch
