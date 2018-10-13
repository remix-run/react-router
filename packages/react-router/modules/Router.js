import React from "react";
import PropTypes from "prop-types";
import warning from "warning";

import RouterContext from "./RouterContext";
import warnAboutGettingProperty from "./utils/warnAboutGettingProperty";

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

// TODO: Remove this
if (!React.createContext) {
  Router.childContextTypes = {
    router: PropTypes.object.isRequired
  };

  Router.prototype.getChildContext = function() {
    const context = getContext(this.props, this.state);

    if (__DEV__) {
      const contextWithoutWarnings = { ...context };

      Object.keys(context).forEach(key => {
        warnAboutGettingProperty(
          context,
          key,
          `You should not be using this.context.router.${key} directly. It is private API ` +
            "for internal use only and is subject to change at any time. Instead, use " +
            "a <Route> or withRouter() to access the current location, match, etc."
        );
      });

      context._withoutWarnings = contextWithoutWarnings;
    }

    return {
      router: context
    };
  };
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
