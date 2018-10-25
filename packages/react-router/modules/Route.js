import React from "react";
import ReactIs from "react-is";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";
import warnAboutGettingProperty from "./utils/warnAboutGettingProperty";

function isEmptyChildren(children) {
  return React.Children.count(children) === 0;
}

function getContext(props, context) {
  const location = props.location || context.location;
  const match = props.computedMatch
    ? props.computedMatch // <Switch> already computed the match for us
    : props.path
      ? matchPath(location.pathname, props)
      : context.match;

  return { ...context, location, match };
}

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Route> outside a <Router>");

          const props = getContext(this.props, context);

          let { children, component, render } = this.props;

          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          if (typeof children === "function") {
            children = children(props);

            if (children === undefined) {
              if (__DEV__) {
                const { path } = this.props;

                warning(
                  false,
                  "You returned `undefined` from the `children` function of " +
                    `<Route${path ? ` path="${path}"` : ""}>, but you ` +
                    "should have returned a React element or `null`"
                );
              }

              children = null;
            }
          }

          return (
            <RouterContext.Provider value={props}>
              {children && !isEmptyChildren(children)
                ? children
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

// TODO: Remove this in v5
if (!React.createContext) {
  Route.contextTypes = {
    router: PropTypes.object.isRequired
  };

  Route.childContextTypes = {
    router: PropTypes.object.isRequired
  };

  Route.prototype.getChildContext = function() {
    invariant(
      this.context.router,
      "You should not use <Route> outside a <Router>"
    );

    let parentContext = this.context.router;
    if (__DEV__) {
      parentContext = parentContext._withoutWarnings;
    }

    const context = getContext(this.props, parentContext);
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
  Route.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: function(props, propName) {
      if (props[propName] && !ReactIs.isValidElementType(props[propName])) {
        return new Error(
          `Invalid prop 'component' supplied to 'Route': the prop is not a valid React component`
        );
      }
    },
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    render: PropTypes.func,
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
  };

  Route.prototype.componentDidMount = function() {
    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.component
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route component> will be ignored"
    );

    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.render
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route render> will be ignored"
    );

    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
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
