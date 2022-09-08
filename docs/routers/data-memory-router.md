---
title: DataMemoryRouter
new: true
---

# `DataMemoryRouter`

A [`MemoryRouter`][memoryrouter] that enables the data APIs like [loader][loader] and [action][action]. Instead of using the browsers history stack like [`DataBrowserRouter`][databrowserrouter], a `DataMemoryRouter` manages it's own history stack in memory. It's primarily useful for testing and component development tools like Storybook, but can also be used for running React Router in any JavaScript environment.

```tsx lines=[1,15-21]
import { DataMemoryRouter } from "react-router-dom";
import * as React from "react";
import {
  render,
  waitFor,
  screen,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import Event from "./routes/event";

test("event route", async () => {
  const FAKE_EVENT = { name: "test event" };

  render(
    <DataMemoryRouter initialEntries={["/events/123"]}>
      <Route
        path="/events/:id"
        element={<Event />}
        loader={() => FAKE_EVENT}
      />
    </DataMemoryRouter>
  );

  await waitFor(() => screen.getByRole("heading"));
  expect(screen.getByRole("heading")).toHaveTextContent(
    FAKE_EVENT.name
  );
});
```

## Type Declaration

```tsx
declare function DataMemoryRouter(
  props: DataMemoryRouterProps
): React.ReactElement;

export interface DataMemoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactNode;
  routes?: RouteObject[];
}
```

## `initialEntries`

The initial entires in the history stack. This allows you to start a test (or an app) with multiple locations already in the history stack (for testing a back navigation, etc.)

```tsx
<DataMemoryRouter initialEntries={["/", "/events/123"]} />
```

## `initialIndex`

The initial index in the history stack to render. This allows you to start a test at a specific entry. It defaults to the last entry in `initialEntries`.

```tsx lines=[4]
<DataMemoryRouter
  initialEntries={["/", "/events/123", "/events/abc"]}
  // start at `/events/123`
  initialIndex={1}
/>
```

## Other props

For all other props, see [`DataBrowserRouter`][databrowserrouter]

[loader]: ../route/loader
[route]: ../components/route
[routes]: ../components/routes
[action]: ../components/route#action
[fetcher]: ../hooks/use-fetcher
[browser-router]: ./browser-router
[form]: ../components/form
[memoryrouter]: ./memory-router
[databrowserrouter]: ./data-browser-router
