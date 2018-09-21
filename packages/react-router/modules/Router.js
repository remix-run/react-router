import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  static getDerivedStateFromProps(nextProps) {
    const { children } = nextProps;

    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    return null;
  }

  getChildContext() {
    return {
      router: {
        ...this.props.router,
        history: this.props.history,
        route: {
          location: this.props.history.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  constructor(props) {
    super(props);
    const { children, history } = props;

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentDidUpdate(prevProps) {
    warning(
      this.props.history === prevProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { children } = this.props;

    return (
      <RouterContext.Provider value={this.getChildContext().router}>
        {children ? React.Children.only(children) : null}
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  Router.propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node,
    router: PropTypes.object
  };
}

export default Router;
