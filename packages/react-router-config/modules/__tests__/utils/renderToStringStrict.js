import React from "react";
import ReactDOMServer from "react-dom/server";

import StrictMode from "./StrictMode";

function renderToStringStrict(element) {
  return ReactDOMServer.renderToString(<StrictMode>{element}</StrictMode>);
}

export default renderToStringStrict;
