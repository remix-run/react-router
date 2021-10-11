import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import ProfileApp from "./App";

ReactDOM.hydrate(
  <React.StrictMode>
    <BrowserRouter basename="profile">
      <ProfileApp />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("app")
);
