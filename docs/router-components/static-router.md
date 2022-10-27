---
title: StaticRouter
---

# `<StaticRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function StaticRouter(
  props: StaticRouterProps
): React.ReactElement;

interface StaticRouterProps {
  basename?: string;
  children?: React.ReactNode;
  location?: Path | LocationPieces;
}
```

</details>

`<StaticRouter>` is used to render a React Router web app in [node][node]. Provide the current location via the `location` prop.

- `<StaticRouter location>` defaults to `"/"`

```tsx
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import http from "http";

function requestHandler(req, res) {
  let html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      {/* The rest of your app goes here */}
    </StaticRouter>
  );

  res.write(html);
  res.end();
}

http.createServer(requestHandler).listen(3000);
```

[node]: https://nodejs.org
