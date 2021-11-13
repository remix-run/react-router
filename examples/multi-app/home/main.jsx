import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import HomeApp from "./App";

ReactDOM.render(
  <React.StrictMode>
    {/* No basename for this router. This app renders at the root / URL. */}
    <BrowserRouter>
      <HomeApp />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
