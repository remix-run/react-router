---
"@react-router/dev": patch
---

Use `module-sync` server condition when enabled in the runtime. This fixes React context mismatches (e.g. `useHref() may be used only in the context of a <Router> component.`) during development on Node 22.10.0+ when using libraries that have a peer dependency on React Router.
