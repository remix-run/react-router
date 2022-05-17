---
title: DataBrowserRouter
new: true
hidden: true
---

# `DataBrowserRouter`

This is the recommended router component for all React Router DOM applications.

`DataBrowserRouter` enables the route data APIs like [loaders][loader], [actions][action], [fetchers][fetcher] and more for browser environments.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { DataBrowserRouter } from "react-router-dom";
import Root from "./routes/root";

ReactDOM.render(
  <DataBrowserRouter>
    <Route element={<Root />} loader={Root.loader}>
      <Route path="team" element={<Team />} loader={Team.loader}>
    </Route>
  </DataBrowserRouter>,
  root
);
```

## Type Declaration

```tsx
declare function DataBrowserRouter(
  props: DataBrowserRouterProps
): React.ReactElement;

export interface DataBrowserRouterProps {
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  window?: Window;
}
```

## Differences from `BrowserRouter`

`BrowserRouter` only keeps your UI in sync with the URL, but does nothing for data with APIs like [loader][loader], [Form][form], and [action][action].

`DataBrowserRouter` keeps your UI in sync with the URL **and also your data**. When the user clicks a link, it will initiate data loading for the next set of matches, revalidate when forms are submitted, etc.

`DataBrowserRouter` also functions as the `Routes` component (it needs to know your routes in order to fetch and manage data). You shouldn't use `<Routes>` with `<DataBrowserRouter>`, instead put your `<Route>` components directly inside of `<DataBrowserRouter>`.

<docs-error>Do not do this</docs-error>

```jsx bad lines=[2,4]
<DataBrowserRouter>
  <Routes>
    <Route element={<Root />} />
  </Routes>
</DataBrowserRouter>
```

<docs-info>Do this</docs-info>

```jsx
<DataBrowserRouter>
  <Route element={<Root />} />
</DataBrowserRouter>
```

## Bundle Sizes

If you are not using the data APIs in your app, it's recommended you use [`BrowserRouter`][browser-router] instead so that the extra code used to manage the internal state of the data APIs will be tree-shaken out of your bundles.

[loader]: ../components/route#loader
[action]: ../components/route#action
[fetcher]: ../hooks/use-fetcher
[browser-router]: ./browser-router
[form]: ../components/form
