import React from "react";

// don't want the shimmed one
// eslint-disable-next-line
import { BrowserRouter } from "../../../packages/react-router-dom";

// this stuff is shimmed, see ReactRouterDOMShim.js for more details
import { Switch, Route } from "react-router-dom";

import DelegateMarkdownLinks from "./DelegateMarkdownLinks";
import Home from "./Home";
import Environment from "./Environment";

const base = document.querySelector("base");
const baseHref = base ? base.getAttribute("href") : "/";

function App() {
  return (
    <BrowserRouter basename={baseHref.replace(/\/$/, "")}>
      <DelegateMarkdownLinks>
        <Switch>
          <Route path="/" exact={true} component={Home} />
          <Route path="/:environment" component={Environment} />
        </Switch>
      </DelegateMarkdownLinks>
    </BrowserRouter>
  );
}

export default App;
