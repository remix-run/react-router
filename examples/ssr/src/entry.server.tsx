import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter as Router } from "react-router-dom/server";
import App from "./app";

export function render(url: string) {
  return ReactDOMServer.renderToString(
    <Router location={url}>
      <App />
    </Router>
  );
}
