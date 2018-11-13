import React from "react";
import PropTypes from "prop-types";
import { createMemoryHistory as createHistory } from "history";
import warning from "tiny-warning";

import Router from "./Router";
import Lifecycle from "./Lifecycle";

/**
 * The public API for a <Router> that stores location in memory.
 */
function MemoryRouter(props) {
  return (
    <Lifecycle>
      {instance => {
        if (!instance.history) {
          instance.history = createHistory(props);
          warning(
            !props.history,
            "<MemoryRouter> ignores the history prop. To use a custom history, " +
              "use `import { Router }` instead of `import { MemoryRouter as Router }`."
          );
        }
        return <Router history={instance.history} children={props.children} />;
      }}
    </Lifecycle>
  );
}

if (__DEV__) {
  MemoryRouter.propTypes = {
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  };
}

export default MemoryRouter;
