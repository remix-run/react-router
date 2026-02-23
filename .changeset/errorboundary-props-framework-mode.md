---
"@remix-run/react-router": patch
"react-router": patch
---

Fixed an issue in framework mode where `ErrorBoundary` components received empty props (`{}`) instead of the documented `ErrorBoundaryProps` interface. The `ErrorBoundary` component now correctly receives `error`, `params`, `loaderData`, and `actionData` as props, aligning runtime behavior with the TypeScript type definitions. The `useRouteError()`, `useParams()`, `useLoaderData()`, and `useActionData()` hooks continue to work as before.
