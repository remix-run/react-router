import React from "react";
import invariant from "invariant";

import RouterContext from "./RouterContext";
import Route, { getContext } from "./Route";

class Match extends React.Component {
  render() {
    Route.displayName = "Match";
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Match> outside a <Router>");

          const props = getContext(this.props, context);

          if (props.match) {
            return <Route {...this.props} />;
          }
        }}
      </RouterContext.Consumer>
    );
  }
}

export default Match;
