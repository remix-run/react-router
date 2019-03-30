import React from "react";
import PropTypes from "prop-types";
import warning from "tiny-warning";
import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

/**
 * The public API for matching a route and providing that match to children.
 */
class Match extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          if (!context) {
            throw new Error(
              __DEV__
                ? "You should not use <Match> outside a <Router>"
                : "Invariant failed"
            );
          }
          const location = this.props.location || context.location;
          let match = this.props.computedMatch
            ? this.props.computedMatch // <Switch> already computed the match for us
            : this.props.path
              ? matchPath(location.pathname, this.props)
              : context.match;

          const props = { ...context, location, match };

          let { children } = this.props;

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
                    `<Match${path ? ` path="${path}"` : ""}>, but you ` +
                    "should have returned a React element or `null`"
                );
              }

              children = null;
            }
          } else if (!!children) {
            return React.Children.map(children, child => {
              if (
                React.isValidElement(child) &&
                typeof child.type !== "string"
              ) {
                return React.cloneElement(child, props);
              } else {
                return child;
              }
            });
          }

          if (children === null) {
            return null;
          }
          return (
            <RouterContext.Provider value={props}>
              {children}
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
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
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
