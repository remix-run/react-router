import React from "react";
import { Router, __Lifecycle as Lifecycle } from "react-router";
import { createBrowserHistory as createHistory } from "history";
import PropTypes from "prop-types";
import warning from "tiny-warning";

/**
 * The public API for a <Router> that uses HTML5 history.
 */
function BrowserRouter(props) {
  return (
    <Lifecycle>
      {instance => {
        if (!instance.history) {
          warning(
            !props.history,
            "<BrowserRouter> ignores the history prop. To use a custom history, " +
              "use `import { Router }` instead of `import { BrowserRouter as Router }`."
          );
          instance.history = createHistory(props);
        }
        return <Router history={instance.history} children={props.children} />;
      }}
    </Lifecycle>
  );
}

if (__DEV__) {
  BrowserRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number
  };
}

export default BrowserRouter;
