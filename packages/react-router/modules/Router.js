import React from "react";
import PropTypes from "prop-types";
import warning from "warning";

import RouterContext from "./RouterContext";

function getContext(props, state) {
  return {
    history: props.history,
    route: {
      location: state.location,
      match: Router.computeRootMatch(state.location.pathname)
    },
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

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    // TODO: Warn about accessing context directly. It will be removed.
    return {
      router: getContext(this.props, this.state)
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

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const context = getContext(this.props, this.state);

    return (
      <RouterContext.Provider value={context}>
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

  Router.prototype.componentDidUpdate = function(prevProps) {
    warning(
      prevProps.history === this.props.history,
      "You cannot change <Router history>"
    );
  };
}

export default Router;
