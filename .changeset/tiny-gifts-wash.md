---
"@react-router/dev": patch
---

Fix virtual module type to properly handle optional properties.

The virtual module `virtual:react-router/server-build` now deliberately implements CommonJS `export =` syntax to correctly support optional properties in the `ServerBuild` type, ensuring proper TypeScript compatibility with `exactOptionalPropertyTypes`.
