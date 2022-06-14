import * as React from "react";
import ReactDOM from "react-dom";
import { DataBrowserRouter } from "react-router-dom";

import { routes } from "./App";

ReactDOM.hydrate(
  <React.StrictMode>
    <DataBrowserRouter
      routes={routes}
      hydrationData={window.__hydrationData}
      fallbackElement={null}
    />
  </React.StrictMode>,
  document.getElementById("app")
);
