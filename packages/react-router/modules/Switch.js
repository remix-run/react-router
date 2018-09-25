import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {router => {
          if (__DEV__) {
            invariant(router, "You should not use <Switch> outside a <Router>");
          }

          const location = this.props.location || router.route.location;

          let child, match;
          React.Children.forEach(this.props.children, element => {
            if (match == null && React.isValidElement(element)) {
              child = element;

              const path = element.props.path || element.props.from;

              match =
                path == null
                  ? router.route.match
                  : matchPath(location.pathname, { ...element.props, path });
            }
          });

          return match
            ? React.cloneElement(child, { location, computedMatch: match })
            : null;
        }}
      </RouterContext.Consumer>
    );
  }
}

if (__DEV__) {
  Switch.propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  };

  Switch.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<Switch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default Switch;
