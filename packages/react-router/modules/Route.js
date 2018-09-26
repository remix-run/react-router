import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

function isEmptyChildren(children) {
  return React.Children.count(children) === 0;
}

function getContext(props, context) {
  const location = props.location || context.location;
  const match = props.computedMatch
    ? props.computedMatch // <Switch> already computed the match for us
    : props.path == null
      ? context.match
      : matchPath(location.pathname, props);

  return {
    ...context,
    location: location,
    match: match
  };
}

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  // TODO: Remove this
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  // TODO: Remove this
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // TODO: Remove this
  getChildContext() {
    invariant(
      this.context.router,
      "You should not use <Route> outside a <Router>"
    );

    // TODO: Warn about accessing this.context.router directly. It will be removed.
    return {
      router: getContext(this.props, this.context.router)
    };
  }

  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Route> outside a <Router>");

          const childContext = getContext(this.props, context);
          const props = { ...context, ...childContext };

          let { children, component, render } = this.props;

          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          return (
            <RouterContext.Provider value={childContext}>
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
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: PropTypes.func,
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.string,
    render: PropTypes.func,
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
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
