import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import InboxApp from "./App";

export function render(url) {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter basename="inbox" location={url}>
        <InboxApp />
      </StaticRouter>
    </React.StrictMode>
  );
}
