---
"@react-router/dev": patch
---

In a `routes.ts` context, ensure the `--mode` flag is respected for `import.meta.env.MODE`

Previously, `import.meta.env.MODE` within a `routes.ts` context was always `"development"` for the `dev` and `typegen --watch` commands, but otherwise resolved to `"production"`. These defaults are still in place, but if a `--mode` flag is provided, this will now take precedence.
