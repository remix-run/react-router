import warning from "warning";
import React from "react";
import PropTypes from "prop-types";
import { createHashHistory as createHistory } from "history";
import Router from "./Router";

/**
 * The public API for a <Router> that uses window.location.hash.
 */
class HashRouter extends React.Component {
  static propTypes = {
    basename: PropTypes.string,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.oneOf(["hashbang", "noslash", "slash"]),
    children: PropTypes.node
  };

  history = createHistory(this.props);

  componentWillMount() {
    warning(
      !this.props.history,
      "<HashRouter> ignores the history prop. To use a custom history, " +
        "use `import { Router }` instead of `import { HashRouter as Router }`."
    );
  }

  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}

export default HashRouter;
