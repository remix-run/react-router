---
title: BrowserRouter
---

# `<BrowserRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function BrowserRouter(
  props: BrowserRouterProps
): React.ReactElement;

interface BrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}
```

</details>

A `<BrowserRouter>` stores the current location in the browser's address bar using clean URLs and navigates using the browser's built-in history stack.

`<BrowserRouter window>` defaults to using the current [document's `defaultView`][defaultview], but it may also be used to track changes to another window's URL, in an `<iframe>`, for example.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    {/* The rest of your app goes here */}
  </BrowserRouter>,
  root
);
```

[defaultview]: https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView
