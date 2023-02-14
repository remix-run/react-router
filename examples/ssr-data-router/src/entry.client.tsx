import * as React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { routes } from "./App";

// If you're using lazy route modules and you haven't yet preloaded them onto
// routes, then you'll need to wait for the router to be initialized before
// hydrating, since it will have initial data to hydrate but it won't yet have
// any router elements to render.
let router = await createBrowserRouter(routes).ready();

ReactDOM.hydrateRoot(
  document.getElementById("app")!,
  <React.StrictMode>
    <RouterProvider router={router} fallbackElement={null} />
  </React.StrictMode>
);
