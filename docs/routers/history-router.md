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

<docs-warning>This API is currently prefixed as `unstable_` because you may unintentionally add two versions of the `history` library to your app, the one you have added to your package.json and whatever version React Router uses internally. If it is allowed by your tooling, it's recommended to not add `history` as a direct dependency and instead rely on the nested dependency from the `react-router` package. Once we have a mechanism to detect mis-matched versions, this API will remove its `unstable_` prefix.</docs-warning>

[history]: https://github.com/remix-run/history
