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

function getContext(props, parentContext) {
  invariant(
    parentContext,
    "You should not use <Route> or withRouter() outside a <Router>"
  );

  return {
    ...parentContext,
    route: {
      location: props.location || parentContext.route.location,
      match: computeMatch(props, parentContext.route)
    }
  };
}

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  getChildContext() {
    // TODO: Warn about accessing context directly. It will be removed.
    return {
      router: getContext(this.props, this.context.router)
    };
  }

  render() {
    return (
      <RouterContext.Consumer>
        {router => {
          const context = getContext(this.props, router);

          const props = {
            history: router.history,
            staticContext: router.staticContext,
            ...context.route
          };

          let { children, component, render } = this.props;

          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          return (
            <RouterContext.Provider value={context}>
              {children
                ? typeof children === "function"
                  ? children(props)
                  : isEmptyChildren(children)
                    ? null
                    : children
                : props.match
                  ? component
                    ? React.createElement(component, props)
                    : render
                      ? render(props)
                      : null
                  : null}
            </RouterContext.Provider>
          );
        }}
      </RouterContext.Consumer>
    );
  }
}

if (__DEV__) {
  Route.propTypes = {
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    sensitive: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };

  Route.prototype.componentDidMount = function() {
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
  };

  Route.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default Route;
