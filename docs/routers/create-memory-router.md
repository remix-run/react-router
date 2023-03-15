---
title: createMemoryRouter
new: true
---

# `createMemoryRouter`

Instead of using the browser's history, a memory router manages its own history stack in memory. It's primarily useful for testing and component development tools like Storybook, but can also be used for running React Router in any non-browser environment.

```jsx lines=[2-3,24-27]
import {
  RouterProvider,
  createMemoryRouter,
} from "react-router-dom";
import * as React from "react";
import {
  render,
  waitFor,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarEvent from "./routes/event";

test("event route", async () => {
  const FAKE_EVENT = { name: "test event" };
  const routes = [
    {
      path: "/events/:id",
      element: <CalendarEvent />,
      loader: () => FAKE_EVENT,
    },
  ];

  const router = createMemoryRouter(routes, {
    initialEntries: ["/", "/events/123"],
    initialIndex: 1,
  });

  render(<RouterProvider router={router} />);

  await waitFor(() => screen.getByRole("heading"));
  expect(screen.getByRole("heading")).toHaveTextContent(
    FAKE_EVENT.name
  );
});
```

## Type Declaration

```tsx
function createMemoryRouter(
  routes: RouteObject[],
  opts?: {
    basename?: string;
    future?: FutureConfig;
    hydrationData?: HydrationState;
    initialEntries?: InitialEntry[];
    initialIndex?: number;
  }
): RemixRouter;
```

## `initialEntries`

The initial entries in the history stack. This allows you to start a test (or an app) with multiple locations already in the history stack (for testing a back navigation, etc.)

```tsx
createMemoryRouter(routes, {
  initialEntries: ["/", "/events/123"],
});
```

## `initialIndex`

The initial index in the history stack to render. This allows you to start a test at a specific entry. It defaults to the last entry in `initialEntries`.

```tsx lines=[3]
createMemoryRouter(routes, {
  initialEntries: ["/", "/events/123"],
  initialIndex: 1, // start at "/events/123"
});
```

## Other props

For all other props, see [`createBrowserRouter`][createbrowserrouter]

[createbrowserrouter]: ./create-browser-router
