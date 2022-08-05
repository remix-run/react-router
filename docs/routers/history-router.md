---
title: HistoryRouter
---

# `<unstable_HistoryRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function HistoryRouter(
  props: HistoryRouterProps
): React.ReactElement;

interface HistoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  history: History;
}
```

</details>

`<unstable_HistoryRouter>` takes an instance of the [`history`][history] library as prop. This allows you to use that instance in non-React contexts or as a global variable.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { createBrowserHistory } from "history";

const history = createBrowserHistory({ window });

ReactDOM.render(
  <HistoryRouter history={history}>
    {/* The rest of your app goes here */}
  </HistoryRouter>,
  root
);
```

<docs-warning>This API is currently prefixed as `unstable_` because we do not intend to support custom histories moving forward. This API is here as a migration aid. We recommend removing custom histories from your app.</docs-warning>

[history]: https://github.com/remix-run/history
