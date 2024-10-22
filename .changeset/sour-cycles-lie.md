---
"@react-router/dev": major
"react-router": major
---

- Consolidate types previously duplicated across `@remix-run/router`, `@remix-run/server-runtime`, and `@remix-run/react` now that they all live in `react-router`
  - Examples: `LoaderFunction`, `LoaderFunctionArgs`, `ActionFunction`, `ActionFunctionArgs`, `DataFunctionArgs`, `RouteManifest`, `LinksFunction`, `Route`, `EntryRoute`
  - The `RouteManifest` type used by the "remix" code is now slightly stricter because it is using the former `@remix-run/router` `RouteManifest`
    - `Record<string, Route> -> Record<string, Route | undefined>`
  - Removed `AppData` type in favor of inlining `unknown` in the few locations it was used
  - Removed `ServerRuntimeMeta*` types in favor of the `Meta*` types they were duplicated from
