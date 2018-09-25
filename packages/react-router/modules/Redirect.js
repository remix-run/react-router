import React from "react";
import PropTypes from "prop-types";
import { createLocation, locationsAreEqual } from "history";
import invariant from "invariant";

import RouterContext from "./RouterContext";
import generatePath from "./generatePath";

class Navigate extends React.Component {
  constructor(props) {
    super(props);
    props.method(props.to);
  }

  componentDidUpdate(prevProps) {
    if (!locationsAreEqual(prevProps.to, this.props.to)) {
      this.props.method(this.props.to);
    }
  }

  render() {
    return null;
  }
}

if (__DEV__) {
  const locationType = PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    hash: PropTypes.string.isRequired
  });

  Navigate.propTypes = {
    method: PropTypes.func.isRequired,
    to: locationType.isRequired
  };
}

/**
 * The public API for navigating programmatically with a component.
 */
function Redirect(props) {
  return (
    <RouterContext.Consumer>
      {router => {
        invariant(router, "You should not use <Redirect> outside a <Router>");

        const method = props.push
          ? router.history.push
          : router.history.replace;
        const to = createLocation(
          props.computedMatch
            ? typeof props.to === "string"
              ? generatePath(props.to, props.computedMatch.params)
              : {
                  ...props.to,
                  pathname: generatePath(
                    props.to.pathname,
                    props.computedMatch.params
                  )
                }
            : props.to
        );

        return <Navigate method={method} to={to} />;
      }}
    </RouterContext.Consumer>
  );
}

Redirect.defaultProps = {
  push: false
};

if (__DEV__) {
  Redirect.propTypes = {
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  };
}

export default Redirect;
