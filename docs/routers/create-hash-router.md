---
title: createHashRouter
new: true
---

# `createHashRouter`

This router is useful if you are unable to configure your web server to direct all traffic to your React Router application. Instead of using normal URLs, it will use the hash (#) portion of the URL to manage the "application URL".

<docs-warning>Using hash URLs is not recommended.</docs-warning>

Other than that, it is functionally the same as [`createBrowserRouter`][createbrowserrouter].

```tsx lines=[4,11]
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";

import Root, { rootLoader } from "./routes/root";
import Team, { teamLoader } from "./routes/team";

const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "team",
        element: <Team />,
        loader: teamLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

[createbrowserrouter]: ./create-browser-router
