Allow explicit route IDs that match properties on `Object.prototype`, including `constructor`, `toString`, `hasOwnProperty`, and `__proto__`

- Preserve these IDs across route manifests, loader/action data, errors, hydration, lazy route discovery, and RSC data flows
- Preserve route parameters named `__proto__` instead of losing them to the object prototype setter
- Build object-form `createSearchParams` entries in one pass instead of repeatedly copying the accumulated array
