import React from "react";
import ReactDOM from "react-dom";

import StrictMode from "./StrictMode.js";

function renderStrict(element, node) {
  ReactDOM.render(<StrictMode>{element}</StrictMode>, node);
}

export default renderStrict;
