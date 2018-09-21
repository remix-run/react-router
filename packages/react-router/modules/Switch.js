import React from "react";
import PropTypes from "prop-types";
import invariant from "invariant";
import warning from "warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

/**
 * The public API for rendering the first <Route> that matches.
 */
class InnerSwitch extends React.Component {
  render() {
    if (__DEV__) {
      invariant(
        this.props.router,
        "You should not use <Switch> outside a <Router>"
      );
    }

    const location = this.props.location || this.props.router.route.location;

    let child, match;
    React.Children.forEach(this.props.children, element => {
      if (match == null && React.isValidElement(element)) {
        child = element;

        const path = element.props.path || element.props.from;

        match =
          path == null
            ? this.props.router.route.match
            : matchPath(location.pathname, { ...element.props, path });
      }
    });

    return match
      ? React.cloneElement(child, { location, computedMatch: match })
      : null;
  }
}

if (__DEV__) {
  InnerSwitch.prototype.componentDidUpdate = function(prevProps) {
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

function Switch(props) {
  return (
    <RouterContext.Consumer>
      {router => <InnerSwitch {...props} router={router} />}
    </RouterContext.Consumer>
  );
}

if (__DEV__) {
  Switch.propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  };
}

export default Switch;
