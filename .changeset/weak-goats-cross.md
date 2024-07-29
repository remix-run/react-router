---
"react-router": major
---

Add `react-router/dom` subpath export to properly enable `react-dom` as an optional `peerDependency`

- This ensures that we don't blindly `import ReactDOM from "react-dom"` in `<RouterProvider>` in order to access `ReactDOM.flushSync()`, since that would break `createMemoryRouter` use cases in a non-DOM environment
- DOM users should `import { RouterProvider } from 'react-router/dom'` to get the proper component that makes `ReactDOM.flushSync()` available
