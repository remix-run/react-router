import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import FeedApp from "./App";

export function render(url) {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter basename="feed" location={url}>
        <FeedApp />
      </StaticRouter>
    </React.StrictMode>
  );
}
