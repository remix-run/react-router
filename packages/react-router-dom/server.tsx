import * as React from 'react';
import * as PropTypes from 'prop-types';
import {
  Action,
  Path,
  Location,
  LocationPieces,
  To,
  createPath,
  parsePath
} from 'history';
import { Router } from 'react-router-dom';

/**
 * A <Router> that may not transition to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function StaticRouter({
  children,
  location: loc = '/'
}: StaticRouterProps) {
  if (typeof loc === 'string') {
    loc = parsePath(loc);
  }

  let action = Action.Pop;
  let location: Location = {
    pathname: loc.pathname || '/',
    search: loc.search || '',
    hash: loc.hash || '',
    state: loc.state || null,
    key: loc.key || 'default'
  };

  let mockHistory = {
    get action() {
      return action;
    },
    get location() {
      return location;
    },
    createHref(to: To) {
      return typeof to === 'string' ? to : createPath(to);
    },
    push(to: To) {
      throw new Error(
        `You cannot use history.push() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to: To) {
      throw new Error(
        `You cannot use history.replace() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`
      );
    },
    go(n: number) {
      throw new Error(
        `You cannot use history.go(${n}) on the server because it is a stateless` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${n})\` somewhere in your app.`
      );
    },
    back() {
      throw new Error(
        `You cannot use history.back() on the server because it is a stateless ` +
          `environment.`
      );
    },
    forward() {
      throw new Error(
        `You cannot use history.forward() on the server because it is a stateless ` +
          `environment.`
      );
    },
    listen() {
      throw new Error(
        `You cannot use history.listen() on the server because it is a stateless ` +
          `environment.`
      );
    },
    block() {
      throw new Error(
        `You cannot use history.block() on the server because it is a stateless ` +
          `environment.`
      );
    }
  };

  return <Router children={children} history={mockHistory} static={true} />;
}

export interface StaticRouterProps {
  children?: React.ReactNode;
  location?: Path | LocationPieces;
}

if (__DEV__) {
  StaticRouter.displayName = 'StaticRouter';
  StaticRouter.propTypes = {
    children: PropTypes.node,
    location: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
        state: PropTypes.object,
        key: PropTypes.string
      })
    ])
  };
}
