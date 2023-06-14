---
title: MemoryRouter
---

# `<MemoryRouter>`

<details>
  <summary>Type declaration</summary>

```tsx
declare function MemoryRouter(
  props: MemoryRouterProps
): React.ReactElement;

interface MemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  future?: FutureConfig;
}
```

</details>

A `<MemoryRouter>` stores its locations internally in an array. Unlike `<BrowserHistory>` and `<HashHistory>`, it isn't tied to an external source, like the history stack in a browser. This makes it ideal for scenarios where you need complete control over the history stack, like testing.

- `<MemoryRouter initialEntries>` defaults to `["/"]` (a single entry at the root `/` URL)
- `<MemoryRouter initialIndex>` defaults to the last index of `initialEntries`

> **Tip:**
>
> Most of React Router's tests are written using a `<MemoryRouter>` as the
> source of truth, so you can see some great examples of using it by just
> [browsing through our tests][tests].

```tsx
import * as React from "react";
import { create } from "react-test-renderer";
import {
  MemoryRouter,
  Routes,
  Route,
} from "react-router-dom";

describe("My app", () => {
  it("renders correctly", () => {
    let renderer = create(
      <MemoryRouter initialEntries={["/users/mjackson"]}>
        <Routes>
          <Route path="users" element={<Users />}>
            <Route path=":id" element={<UserProfile />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
```

## `basename`

Configure your application to run underneath a specific basename in the URL:

```jsx
function App() {
  return (
    <MemoryRouter basename="/app">
      <Routes>
        <Route path="/" /> {/* 👈 Renders at /app/ */}
      </Routes>
    </MemoryRouter>
  );
}
```

## `future`

An optional set of [Future Flags][api-development-strategy] to enable. We recommend opting into newly released future flags sooner rather than later to ease your eventual migration to v7.

```jsx
function App() {
  return (
    <MemoryRouter future={{ v7_startTransition: true }}>
      <Routes>{/*...*/}</Routes>
    </MemoryRouter>
  );
}
```

[defaultview]: https://developer.mozilla.org/en-US/docs/Web/API/Document/defaultView
[api-development-strategy]: ../guides/api-development-strategy
[tests]: https://github.com/remix-run/react-router/tree/main/packages/react-router/__tests__
