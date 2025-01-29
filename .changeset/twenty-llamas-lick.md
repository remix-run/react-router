---
"@react-router/dev": patch
---

Fix prerendering when using a custom server - previously we ended up trying to import the users custom server when we actually want to import the virtual server build module
