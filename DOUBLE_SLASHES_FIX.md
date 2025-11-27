# Fix for RSC Double Slashes Issue #14583

## Problem Description

When using React Router with RSC (React Server Components), URLs containing double slashes (e.g., `https://domain//en//test2/test`) would cause `ERR_NAME_NOT_RESOLVED` errors when the router tried to load manifest files. This happened because the `getManifestUrl` function in `packages/react-router/lib/rsc/browser.tsx` was not normalizing double slashes in paths, leading to malformed URLs like `https://en//test/test.manifest`.

## Root Cause

The issue was in the `getManifestUrl` function which constructs URLs for manifest files without normalizing double slashes in:
1. Single path manifest URLs
2. Multiple paths in manifest URL query parameters  
3. Basename paths

## Solution

The fix normalizes double slashes using the existing `joinPaths` utility function from `../router/utils.ts`:

### Changes Made

1. **Import `joinPaths` utility**: Added `joinPaths` to the imports from `../router/utils`
2. **Normalize single path URLs**: Use `joinPaths([paths[0]])` to normalize the path before creating the manifest URL
3. **Normalize multiple paths**: Use `paths.map(path => joinPaths([path]))` to normalize all paths before joining them in the query parameter
4. **Normalize basename**: Use `joinPaths([basename])` to normalize the basename

### Code Changes

**File**: `packages/react-router/lib/rsc/browser.tsx`

```typescript
// Before
import { ErrorResponseImpl, createContext } from "../router/utils";

// After  
import { ErrorResponseImpl, createContext, joinPaths } from "../router/utils";
```

```typescript
// Before
function getManifestUrl(paths: string[]): URL | null {
  if (paths.length === 0) {
    return null;
  }

  if (paths.length === 1) {
    return new URL(`${paths[0]}.manifest`, window.location.origin);
  }

  const globalVar = window as WindowWithRouterGlobals;
  let basename = (globalVar.__reactRouterDataRouter.basename ?? "").replace(
    /^\/|\/$/g,
    "",
  );
  let url = new URL(`${basename}/.manifest`, window.location.origin);
  url.searchParams.set("paths", paths.sort().join(","));

  return url;
}

// After
function getManifestUrl(paths: string[]): URL | null {
  if (paths.length === 0) {
    return null;
  }

  if (paths.length === 1) {
    // Normalize double slashes in the single path
    const normalizedPath = joinPaths([paths[0]]);
    return new URL(`${normalizedPath}.manifest`, window.location.origin);
  }

  const globalVar = window as WindowWithRouterGlobals;
  let basename = (globalVar.__reactRouterDataRouter.basename ?? "").replace(
    /^\/|\/$/g,
    "",
  );
  // Normalize double slashes in basename
  basename = joinPaths([basename]);
  let url = new URL(`${basename}/.manifest`, window.location.origin);
  // Normalize double slashes in all paths before joining
  const normalizedPaths = paths.map(path => joinPaths([path]));
  url.searchParams.set("paths", normalizedPaths.sort().join(","));

  return url;
}
```

## Testing

### Test Cases Verified

1. **Single path with double slashes**: `//en//test2/test` → `/en/test2/test.manifest`
2. **Multiple paths with double slashes**: `[//en//test1, //fr//test2]` → query param `paths=/en/test1,/fr/test2`
3. **Basename with double slashes**: `/app//base/` → `/app/base/.manifest`
4. **Normal paths**: Continue to work as expected

### Test Files Created

- `packages/react-router/__tests__/rsc-double-slashes-test.ts`: Unit tests for URL normalization
- `integration/rsc-double-slashes-test.ts`: Integration tests for RSC functionality
- `test-double-slashes-fix.js`: Verification script for the fix
- `test-rsc-double-slashes-integration.js`: Integration verification script

## Impact

This fix resolves the `ERR_NAME_NOT_RESOLVED` errors that occur when:
- Users navigate to URLs with double slashes in RSC applications
- The router attempts to fetch manifest files for route discovery
- Basename configurations contain double slashes

## Backward Compatibility

This change is fully backward compatible as it only normalizes URLs that would have been malformed anyway. Normal URLs without double slashes continue to work exactly as before.

## Related Issue

Fixes #14583: RSC / Routing Issue on Double Slashes

## Files Modified

- `packages/react-router/lib/rsc/browser.tsx`: Main fix implementation
- `packages/react-router/__tests__/rsc-double-slashes-test.ts`: Unit tests
- `integration/rsc-double-slashes-test.ts`: Integration tests