import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

function isEmptyChildren(children) {
  return React.Children.count(children) === 0;
}

function computeMatch(props, parentRoute) {
  if (props.computedMatch) return props.computedMatch; // <Switch> already computed the match for us

  return props.path == null
    ? parentRoute.match
    : matchPath((props.location || parentRoute.location).pathname, props);
}

/**
 * The public API for matching a single path and rendering.
 */
class InnerRoute extends React.Component {
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    return {
      router: {
        ...this.props.router,
        route: {
          location: this.props.location || this.props.router.route.location,
          match: computeMatch(this.props, this.props.router.route)
        }
      }
    };
  }

  componentWillMount() {
    invariant(
      this.props.router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  }

  render() {
    const context = this.getChildContext().router;
    const props = {
      ...context.route,
      history: this.props.router.history,
      staticContext: this.props.router.staticContext
    };

    let { children, component, render } = this.props;

    if (Array.isArray(children) && children.length === 0) {
      children = null; // Preact uses an empty array as children by default
    }

    return (
      <RouterContext.Provider value={context}>
        {children
          ? typeof children === "function"
            ? children(props)
            : isEmptyChildren(children)
              ? null
              : children
          : component
            ? props.match
              ? React.createElement(component, props)
              : null
            : render
              ? props.match
                ? render(props)
                : null
              : null}
      </RouterContext.Provider>
    );
  }
}

if (__DEV__) {
  InnerRoute.propTypes = {
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    sensitive: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };
}

const Route = props => (
  <RouterContext.Consumer>
    {router => <InnerRoute {...props} router={router} />}
  </RouterContext.Consumer>
);

export default Route;
