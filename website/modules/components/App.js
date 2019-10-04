import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import basename from "../basename.js";
import DelegateMarkdownLinks from "./DelegateMarkdownLinks.js";
import Home from "./Home/index.js";
import Environment from "./Environment.js";

export default function App() {
  return (
    <Router basename={basename}>
      <DelegateMarkdownLinks>
        <Switch>
          <Route path="/" exact={true} component={Home} />
          <Route path="/:environment" component={Environment} />
        </Switch>
      </DelegateMarkdownLinks>
    </Router>
  );
}
