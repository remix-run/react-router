import React from "react";
import { Router, __Lifecycle as Lifecycle } from "react-router";
import { createHashHistory as createHistory } from "history";
import PropTypes from "prop-types";
import warning from "tiny-warning";

/**
 * The public API for a <Router> that uses window.location.hash.
 */
function HashRouter(props) {
  return (
    <Lifecycle>
      {instance => {
        if (!instance.history) {
          instance.history = createHistory(props);
          warning(
            !props.history,
            "<HashRouter> ignores the history prop. To use a custom history, " +
              "use `import { Router }` instead of `import { HashRouter as Router }`."
          );
        }
        return <Router history={instance.history} children={props.children} />;
      }}
    </Lifecycle>
  );
}

if (__DEV__) {
  HashRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.oneOf(["hashbang", "noslash", "slash"])
  };
}

export default HashRouter;
