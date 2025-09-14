---
title: Installation
order: 1
---

# Installation

[MODES: data]

## Bootstrap with a Bundler Template

You can start with a React template from Vite and choose "React", otherwise bootstrap your application however you prefer (Parcel, Webpack, etc).

```shellscript nonumber
npx create-vite@latest
```

## Install React Router

Next install React Router from npm:

```shellscript nonumber
npm i react-router
```

## Create a Router and Render

Create a router and pass it to `RouterProvider`:

```tsx lines=[3-4,6-11,16]
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello World</div>,
  },
]);

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <RouterProvider router={router} />,
);
```

---

Next: [Routing](./routing)
