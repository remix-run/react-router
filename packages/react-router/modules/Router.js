import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  };

  static contextTypes = {
    router: PropTypes.object
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);

    const { children, history } = props;

    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    if (!this.isStatic()) {
      // Do this here so we can setState when a <Redirect> changes the
      // location in componentDidMount. This happens e.g. when doing
      // server rendering using a <StaticRouter>.
      this.unlisten = history.listen(() => {
        this.setState({
          match: this.computeMatch(history.location.pathname)
        });
      });
    }
  }

  componentDidMount() {
    if (this.isStatic()) {
      const { history } = this.props;
      // Do this here so we can setState when a <Redirect> changes the
      // location in componentDidMount. This happens e.g. when doing
      // server rendering using a <StaticRouter>.
      this.unlisten = history.listen(() => {
        this.setState({
          match: this.computeMatch(history.location.pathname)
        });
      });
    }
  }

  getChildContext() {
    return {
      router: {
        ...this.context.router,
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
    return children ? React.Children.only(children) : null;
  }

  isStatic() {
    return (
      this.context && this.context.router && this.context.router.staticContext
    );
  }
}

export default Router;
