---
"react-router": patch
---

Fix RSC Data Mode issue where routes that return `false` from `shouldRevalidate` would be replaced by an `<Outlet />`
