import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import DelegateMarkdownLinks from "./DelegateMarkdownLinks";
import Home from "./Home";
import Environment from "./Environment";
import basename from "../basename";

function App() {
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

export default App;
