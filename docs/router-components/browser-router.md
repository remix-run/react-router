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
  future?: FutureConfig;
  window?: Window;
}
```

</details>

A `<BrowserRouter>` stores the current location in the browser's address bar using clean URLs and navigates using the browser's built-in history stack.

```tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    {/* The rest of your app goes here */}
  </BrowserRouter>
);
```

## `basename`

Configure your application to run underneath a specific basename in the URL:

```jsx
function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/" /> {/* 👈 Renders at /app/ */}
      </Routes>
    </BrowserRouter>
  );
}
```

## `future`

An optional set of [Future Flags][api-development-strategy] to enable. We recommend opting into newly released future flags sooner rather than later to ease your eventual migration to v7.

```jsx
function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <Routes>{/*...*/}</Routes>
    </BrowserRouter>
  );
}
```

## `window`

`BrowserRouter` defaults to using the current [document's `defaultView`][defaultview], but it may also be used to track changes to another window's URL, in an `<iframe>`, for example.

[defaultview]: https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView
[api-development-strategy]: ../guides/api-development-strategy
