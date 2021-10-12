import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import HomeApp from "./App";

ReactDOM.hydrate(
  <React.StrictMode>
    <BrowserRouter>
      <HomeApp />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
