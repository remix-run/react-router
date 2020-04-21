import * as React from 'react';
import { Router } from 'react-router-dom';
import { createPath, parsePath } from 'history';
import PropTypes from 'prop-types';

/**
 * A <Router> that may not transition to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function StaticRouter({ children, location: loc = '/' }) {
  if (typeof loc === 'string') loc = parsePath(loc);

  let action = 'POP';
  let location = {
    pathname: loc.pathname || '/',
    search: loc.search || '',
    hash: loc.hash || '',
    state: loc.state || null,
    key: loc.key || 'default'
  };

  let mockHistory = {
    // This is a clue that lets us warn about using a <Navigate>
    // on the initial render inside a <StaticRouter>
    static: true,
    get action() {
      return action;
    },
    get location() {
      return location;
    },
    createHref(to) {
      return typeof to === 'string' ? to : createPath(to);
    },
    push(to, state) {
      throw new Error(
        `You cannot perform a PUSH on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to) {
      throw new Error(
        `You cannot perform a REPLACE on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`
      );
    },
    go(n) {
      throw new Error(
        `You cannot perform ${n === -1 ? 'GO BACK' : `a GO(${n})`} on the ` +
          `server because it is a stateless environment. This error was probably ` +
          `triggered when you did a \`navigate(${n})\` somewhere in your app.`
      );
    },
    listen() {},
    block() {}
  };

  return <Router children={children} history={mockHistory} />;
}

if (__DEV__) {
  StaticRouter.displayName = 'StaticRouter';
  StaticRouter.propTypes = {
    children: PropTypes.node,
    location: PropTypes.oneOfType([
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
        state: PropTypes.object,
        key: PropTypes.string
      }),
      PropTypes.string
    ])
  };
}
