---
title: Magic Search Params
toc: false
---

# Magic Search Params Example

This example shows how to read and write search parameters in the URL with `useMagicSearchParams`.  
It includes forcing fixed parameters, omitting specific values, and handling arrays through different serialization modes.

**What does it do?**
1. Applies mandatory and optional parameters.
2. Defines how to convert or maintain values in the URL (e.g., CSV, repeat, brackets).
3. Allows listening to parameter changes to trigger asynchronous actions.

**Quick usage:**
1. Import `useMagicSearchParams`.
2. Configure `defaultParams` and `forceParams`.
3. Update parameters with `updateParams`.
4. Listen to specific changes with `onChange`.

To see a complete example, check the `App.tsx` component in this folder.
