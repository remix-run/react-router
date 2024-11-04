---
title: Manual Usage
---

# Manual Usage

While React Router comes with a Vite plugin to enable easier access to its full feature-set, you can use it as a "library" as well.

If you're building your own framework on top of React Router, you'll want to reference the [API Docs](https://api.reactrouter.com) for documentation on the full API.

## Setting up

You can start with a React template from Vite and choose "React"

```shellscript nonumber
npx create-vite@latest
```

Then install React Router:

```shellscript nonumber
npm i react-router
```

## Router Components

Rendering a `<BrowserRouter>` will create a router context and subscribe to the URL for changes. Then render `<Routes>` anywhere beneath it to match the URL to an element.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./home";
import Dashboard from "./dashboard";
import RecentActivity from "./recent-activity";
import Project from "./project";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="dashboard" element={<Dashboard />}>
        <Route index element={<RecentActivity />} />
        <Route path="project/:id" element={<Project />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
```

## Data Routers

A Data Router adds data loading and actions to the router. Loaders are called before components are rendered, data is revalidated from loaders after actions are called, etc. This is how the React Router Vite plugin adds framework features to React Router.

You can use the `createDataRouter` function to create your own along with `<RouterProvider />`.

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import Root, { rootLoader } from "./routes/root";
import Team, { teamLoader } from "./routes/team";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: rootLoader,
    children: [
      {
        path: "team",
        element: <Team />,
        loader: teamLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```
