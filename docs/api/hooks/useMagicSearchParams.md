---
title: useMagicSearchParams
---

# useMagicSearchParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://github.com/Gabriel117343/react-magic-search-params)

This hook supports reading and writing search parameters with extended functionality:
- Forcing or omitting specific values.
- Handling arrays in different serialization modes (e.g., CSV, repeat).
- Watching for changes to trigger custom actions.

```tsx
import { useMagicSearchParams } from "react-router";

export function MyComponent() {
  // Ensure the autocompletation with typescript
  const { searchParams, getParams, updateParams, clearParams, onChange } = useMagicSearchParams({
    optional: paramsUser.optional,
    mandatory: paramsUsers.mandatory,
    // the default to get the API on the first page load
    defaultParams: paramsUser.mandatory,
    forceParams: { page_size: 10 },
    arraySerialization: 'csv',
    omitParamsByValues: ['all', 'default']
  });
  // get the original type
  const { page, page_size, order, tags } = getParams({ convert: true })
  console.log(tags) // ['tag1', 'tag2']
  // ...
}
```
__No documentation__
