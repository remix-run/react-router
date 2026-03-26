---
"@react-router/dev": patch
---

Fix typegen for pathless layouts with only nested layout children

Previously, typegen would generate invalid TypeScript when a pathless layout route had only other pathless layout routes as children (no pages). This fix handles the case where `pages.size` is 0 by generating valid TypeScript.
