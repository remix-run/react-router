---
title: HashRouter
---

# `<HashRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function HashRouter(
  props: HashRouterProps
): React.ReactElement;

interface HashRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}
```

</details>

`<HashRouter>` is for use in web browsers when the URL should not (or cannot) be sent to the server for some reason. This may happen in some shared hosting scenarios where you do not have full control over the server. In these situations, `<HashRouter>` makes it possible to store the current location in the `hash` portion of the current URL, so it is never sent to the server.

`<HashRouter window>` defaults to using the current [document's `defaultView`][defaultview], but it may also be used to track changes to another window's URL, in an `<iframe>`, for example.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";

ReactDOM.render(
  <HashRouter>
    {/* The rest of your app goes here */}
  </HashRouter>,
  root
);
```

<docs-warning>We strongly recommend you do not use `HashRouter` unless you absolutely have to.</docs-warning>

[defaultview]: https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView
