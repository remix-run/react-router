---
"react-router": major
---

Add `react-router/dom` subpath export to properly enable `react-dom` as an optional `peerDependency`

- This ensures that we don't blindly `import ReactDOM from "react-dom"` in `<RouterProvider>` in order to access `ReactDOM.flushSync()`, since that would break `createMemoryRouter` use cases in non-DOM environments
- DOM environments should import from `react-router/dom` to get the proper component that makes `ReactDOM.flushSync()` available:
  - If you are using the Vite plugin, use this in your `entry.client.tsx`:
    - `import { HydratedRouter } from 'react-router/dom'`
  - If you are not using the Vite plugin and are manually calling `createBrowserRouter`/`createHashRouter`:
    - `import { RouterProvider } from "react-router/dom"`
