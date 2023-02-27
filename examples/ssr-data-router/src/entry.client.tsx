import * as React from "react";
import ReactDOM from "react-dom/client";
import { resolveLazyRoutes } from "@remix-run/router";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { routes } from "./App";

resolveLazyRoutes(routes, window.location).then(() => {
  let router = createBrowserRouter(routes);

  ReactDOM.hydrateRoot(
    document.getElementById("app")!,
    <React.StrictMode>
      <RouterProvider router={router} fallbackElement={null} />
    </React.StrictMode>
  );
});
