import React from 'react';
import { Router } from 'react-router-dom';
import { createPath, parsePath } from 'history';
import PropTypes from 'prop-types';

/**
 * A <Router> that may not transition to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function StaticRouter({ children, context = {}, location: loc = '/' }) {
  if (typeof loc === 'string') loc = parsePath(loc);

  let action = 'POP';
  let location = {
    pathname: loc.pathname || '/',
    search: loc.search || '',
    hash: loc.hash || '',
    state: loc.state || null,
    key: loc.key || 'default'
  };

  function getNextLocation(to, state) {
    return {
      ...location,
      ...(typeof to === 'string' ? parsePath(to) : to),
      state
    };
  }

  let mockHistory = {
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
      let nextLocation = getNextLocation(to, state);

      if (__DEV__) {
        let url = createPath(nextLocation);

        // A PUSH is not technically valid in a static context because we can't
        // push a new URL onto the history stack in a stateless environment. They
        // most likely want a regular redirect so just warn them and carry on.
        console.warn(
          `You cannot perform a PUSH with a <StaticRouter>. You probably want a REPLACE instead.` +
            `\n\nTo avoid this warning, find the element that is calling \`navigate("${url}")\`` +
            ` and change it to \`navigate("${url}", { replace: true })\`. This could also be` +
            ` caused by rendering a \`<Navigate to={"${url}"} />\`. In that case, just add a ` +
            `\`replace={true}\` prop to do a redirect instead.`
        );
      }

      context.url = createPath(nextLocation);
      context.state = nextLocation.state;
    },
    replace(to, state) {
      let nextLocation = getNextLocation(to, state);
      context.url = createPath(nextLocation);
      context.state = nextLocation.state;
    },
    go(n) {
      throw new Error(
        `You cannot perform ${n === -1 ? 'GO BACK' : `GO(${n})`} on the ` +
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
