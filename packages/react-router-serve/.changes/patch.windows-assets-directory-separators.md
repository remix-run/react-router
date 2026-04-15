Normalize `assetsBuildDirectory` path separators in `react-router-serve` so Windows-built server artifacts can serve `/assets/*` correctly when run on Linux.

- Handles backslash-separated `assetsBuildDirectory` values from cross-platform build copies.
- Adds integration coverage for a Windows-style server build metadata scenario.
