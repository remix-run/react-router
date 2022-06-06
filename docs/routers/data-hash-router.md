---
title: DataHashRouter
new: true
---

# `DataHashRouter`

This router is useful if you are unable to configure your web server to direct all traffic to your React Router application. Instead of using normal URLs, it will use the hash (#) portion of the URL to manage the "application URL".

<docs-error>Using hash URLs is not recommended. </docs-error>

Other than that, it is functionally the same as [DataBrowserRouter][databrowserrouter].

```tsx lines=[3,7,11]
import * as React from "react";
import * as ReactDOM from "react-dom";
import { DataHashRouter } from "react-router-dom";
import Root from "./routes/root";

ReactDOM.render(
  <DataHashRouter>
    <Route element={<Root />} loader={Root.loader}>
      <Route path="team" element={<Team />} loader={Team.loader}>
    </Route>
  </DataHashRouter>,
  root
);
```

## Type Declaration

```tsx
declare function DataHashRouter(
  props: DataBrowserRouterProps
): React.ReactElement;

export interface DataHashRouterProps {
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactNode;
  routes?: RouteObject[];
  window?: Window;
}
```

[loader]: ../route/loader
[action]: ../route/action
[fetcher]: ../hooks/use-fetcher
[browser-router]: ./browser-router
[form]: ../components/form
[databrowserrouter]: ./data-browser-router
