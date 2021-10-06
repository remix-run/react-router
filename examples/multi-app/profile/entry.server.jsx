import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import ProfileApp from "./App";

export function render(url) {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter basename="profile" location={url}>
        <ProfileApp />
      </StaticRouter>
    </React.StrictMode>
  );
}
