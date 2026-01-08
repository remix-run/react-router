---
"react-router": patch
"react-router-dom": patch
"@react-router/dev": patch
"@react-router/cloudflare": patch
"@react-router/node": patch
"@react-router/serve": patch
"@react-router/fs-routes": patch
"@react-router/express": patch
"@react-router/architect": patch
"@react-router/remix-routes-option-adapter": patch
"create-react-router": patch
---

Fix regression in v7.9.6 where relative paths with colons (like `my-path:value`) were incorrectly treated as absolute URLs. The router now correctly distinguishes between actual absolute URLs (like `mailto:`, `tel:`, `http://`) and relative paths containing colons.

Fixes #14711
