---
"react-router": patch
---

- Properly bubble headers as `errorHeaders` when throwing a `data()` result
- Avoid duplication of `Set-Cookie` headers could be duplicated if also returned from `headers`
