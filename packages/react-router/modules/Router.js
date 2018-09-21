import React from "react";
import PropTypes from "prop-types";
import warning from "warning";

import RouterContext from "./RouterContext";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        history: this.props.history,
        route: {
          location: this.state.location,
          match: Router.computeRootMatch(this.state.location.pathname)
        },
        staticContext: this.props.staticContext
      }
    };
  }

  state = {
    location: this.props.history.location
  };

  componentWillMount() {
    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = this.props.history.listen(location => {
      this.setState({ location });
    });
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    return (
      <RouterContext.Provider value={this.getChildContext().router}>
        {this.props.children || null}
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  Router.propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired,
    staticContext: PropTypes.object
  };
}

export default Router;
