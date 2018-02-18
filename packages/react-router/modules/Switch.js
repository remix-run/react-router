import React from "react";
import PropTypes from "prop-types";
import warning from "warning";
import invariant from "invariant";
import matchPath from "./matchPath";

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      route: PropTypes.object.isRequired
    }).isRequired
  };

  static propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  };

  componentWillMount() {
    invariant(
      this.context.router,
      "You should not use <Switch> outside a <Router>"
    );
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Switch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  }

  render() {
    const { route } = this.context.router;
    const { children } = this.props;
    const location = this.props.location || route.location;
    const { match, child } = this.getMatch(route, location, children);

    return match
      ? React.cloneElement(child, { location, computedMatch: match })
      : null;
  }

  getMatch(route, location, children) {
    let child = null;
    let match = null;

    React.Children.forEach(children, element => {
      if (match == null && React.isValidElement(element)) {
        if (
          React.Fragment != null && // Fragment support is only available in React.js >= 16.2
          element.type === React.Fragment
        ) {
          const subMatch = this.getMatch(
            route,
            location,
            element.props.children
          );
          child = subMatch.child;
          match = subMatch.match;
        } else {
          const {
            path: pathProp,
            exact,
            strict,
            sensitive,
            from
          } = element.props;
          const path = pathProp || from;

          child = element;
          match = path
            ? matchPath(location.pathname, { path, exact, strict, sensitive })
            : route.match;
        }
      }
    });

    return { child, match };
  }
}

export default Switch;
