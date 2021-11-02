import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import InboxApp from "./App";

ReactDOM.render(
  <React.StrictMode>
    {/* "Mount" this app under the /inbox URL pathname. All routes and links
        are relative to this name. */}
    <BrowserRouter basename="inbox">
      <InboxApp />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
