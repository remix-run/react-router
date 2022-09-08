import * as React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, DataRouter } from "react-router-dom";

import { routes } from "./App";

let router = createBrowserRouter(routes);

ReactDOM.hydrateRoot(
  document.getElementById("app"),
  <React.StrictMode>
    <DataRouter router={router} fallbackElement={null} />
  </React.StrictMode>
);
