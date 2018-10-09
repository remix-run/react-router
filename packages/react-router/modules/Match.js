import React from "react";
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
class Match extends React.Component {
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
      "You should not use <Match> outside a <Router>"
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
            "a <Match> or withRouter() to access the current location, match, etc."
        );
      });

      context._withoutWarnings = contextWithoutWarnings;
    }

    return {
      router: context
    };
  }

  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Match> outside a <Router>");

          const props = getContext(this.props, context);

          let { children, component, render } = this.props;
          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          if (typeof children === "function") {
            children = props.match ? children(props) : null;

            if (children === undefined) {
              if (__DEV__) {
                const { path } = this.props;

                warning(
                  false,
                  "You returned `undefined` from the `children` function of " +
                    `<Match${path ? ` path="${path}"` : ""}>, but you ` +
                    "should have returned a React element or `null`"
                );
              }

              children = null;
            }
          }
          if (props.match === null) children = null;
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

if (__DEV__) {
  Match.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: PropTypes.func,
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.string,
    render: PropTypes.func,
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
  };

  Match.prototype.componentDidMount = function() {
    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.component
      ),
      "You should not use <Match component> and <Match children> in the same route; <Match component> will be ignored"
    );

    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.render
      ),
      "You should not use <Match render> and <Match children> in the same route; <Match render> will be ignored"
    );

    warning(
      !(this.props.component && this.props.render),
      "You should not use <Match component> and <Match render> in the same route; <Match render> will be ignored"
    );
  };

  Match.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<Match> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<Match> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default Match;
