---
"react-router": patch
---

Switch Lazy Route Discovery manifest URL generation to usea standalone `URLSearchParams` instance instead of `URL.searchParams` to avoid a major performance bottleneck in Chrome
