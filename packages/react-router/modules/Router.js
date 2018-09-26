import React from "react";
import PropTypes from "prop-types";
import warning from "warning";

import RouterContext from "./RouterContext";

function getContext(props, state) {
  return {
    history: props.history,
    location: state.location,
    match: Router.computeRootMatch(state.location.pathname),
    staticContext: props.staticContext
  };
}

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static computeRootMatch(pathname) {
    return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
  }

  // TODO: Remove this
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // TODO: Remove this
  getChildContext() {
    // TODO: Warn about accessing this.context.router directly. It will be removed.
    return {
      router: getContext(this.props, this.state)
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      location: props.history.location
    };

    this.unlisten = props.history.listen(location => {
      this.setState({ location });
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const context = getContext(this.props, this.state);

    return (
      <RouterContext.Provider
        children={this.props.children || null}
        value={context}
      />
    );
  }
}

if (__DEV__) {
  Router.propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired,
    staticContext: PropTypes.object
  };

  Router.prototype.componentDidUpdate = function(prevProps) {
    warning(
      prevProps.history === this.props.history,
      "You cannot change <Router history>"
    );
  };
}

export default Router;
