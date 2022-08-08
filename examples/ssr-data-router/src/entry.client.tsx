import * as React from "react";
import ReactDOM from "react-dom/client";
import { DataBrowserRouter } from "react-router-dom";

import { routes } from "./App";

ReactDOM.hydrateRoot(
  document.getElementById("app"),
  <React.StrictMode>
    <DataBrowserRouter routes={routes} fallbackElement={null} />
  </React.StrictMode>
);
