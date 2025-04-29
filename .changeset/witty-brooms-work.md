---
"@react-router/dev": patch
---

Fix `TS2300: Duplicate identifier` errors caused by generated types

Previously, routes that had the same full path would cause duplicate entries in the generated types for `href` (`.react-router/types/+register.ts`), causing type checking errors.
