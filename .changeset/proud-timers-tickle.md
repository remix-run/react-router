---
"@remix-run/router": patch
---

- Throw an error if an `action`/`loader` function returns `undefined` as revalidations need to know whether the loader has previously been executed. `undefined` also causes issues during SSR stringification for hydration. You should always ensure you `loader`/`action` return a value, and you may return `null` if you don't wish to return anything.
- Enhanced `ErrorResponse` bodies to contain more descriptive text in internal 403/404/405 scenarios
