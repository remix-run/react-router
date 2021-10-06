import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import FeedApp from "./App";

ReactDOM.hydrate(
  <React.StrictMode>
    <BrowserRouter basename="feed">
      <FeedApp />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("app")
);
