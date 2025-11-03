---
"@react-router/dev": patch
---

Short circuit `HEAD` document requests before calling `renderToPipeableStream` in the default `entry.server.tsx` to more closely align with the [spec](https://httpwg.org/specs/rfc9110.html#HEAD)
