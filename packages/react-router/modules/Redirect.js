import React from "react";
import PropTypes from "prop-types";
import { createLocation, locationsAreEqual } from "history";
import invariant from "tiny-invariant";

import Lifecycle from "./Lifecycle";
import RouterContext from "./RouterContext";
import generatePath from "./generatePath";

/**
 * The public API for navigating programmatically with a component.
 */
function Redirect(props) {
  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, "You should not use <Redirect> outside a <Router>");

        const method = props.push
          ? context.history.push
          : context.history.replace;
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

        // When rendering in a static context,
        // set the new location immediately.
        if (context.staticContext) {
          method(to);
          return null;
        }

        return (
          <Lifecycle
            onMount={() => {
              method(to);
            }}
            onUpdate={(self, prevProps) => {
              if (!locationsAreEqual(prevProps.to, to)) {
                method(to);
              }
            }}
            to={to}
          />
        );
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
