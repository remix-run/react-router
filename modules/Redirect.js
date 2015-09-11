import React from 'react';
import invariant from 'invariant';
import { createRouteFromReactElement } from './RouteUtils';
import { formatPattern } from './PatternUtils';
import { falsy } from './PropTypes';

var { string, object } = React.PropTypes;

/**
 * A <Redirect> is used to declare another URL path a client should be sent
 * to when they request a given URL.
 *
 * Redirects are placed alongside routes in the route configuration and are
 * traversed in the same manner.
 */
var Redirect = React.createClass({

  statics: {

    createRouteFromReactElement(element) {
      var route = createRouteFromReactElement(element);

      if (route.from)
        route.path = route.from;

      // TODO: Handle relative pathnames, see #1658
      invariant(
        route.to.charAt(0) === '/',
        '<Redirect to> must be an absolute path. This should be fixed in the future'
      );

      route.onEnter = function (nextState, replaceState) {
        var { location, params } = nextState;
        var pathname = route.to ? formatPattern(route.to, params) : location.pathname;

        replaceState(
          route.state || location.state,
          pathname,
          route.query || location.query
        );
      };

      return route;
    }

  },

  propTypes: {
    path: string,
    from: string, // Alias for path
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: falsy,
    children: falsy
  },

  render() {
    invariant(
      false,
      '<Redirect> elements are for router configuration only and should not be rendered'
    );
  }

});

export default Redirect;
