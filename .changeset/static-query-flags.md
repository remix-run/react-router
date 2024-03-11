---
"@remix-run/router": minor
---

Added 2 new options to the `staticHandler.query` method for use in Remix's Single Fetch implementation:

- `loadRouteIds`: An optional array of route IDs to load if you wish to load a subset of the matched routes (useful for fine-grained revalidation)
- `skipLoaderErrorBubbling`: Disable error bubbling on loader executions for single-fetch scenarios where the client-side router will handle the bubbling
