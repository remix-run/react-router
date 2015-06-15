import React from 'react';
import invariant from 'invariant';
import { createRouteFromReactElement } from './RouteUtils';
import { formatPattern } from './URLUtils';
import { falsy } from './PropTypes';

var { string, object } = React.PropTypes;

export var Redirect = React.createClass({

  statics: {

    createRouteFromReactElement(element) {
      var route = createRouteFromReactElement(element);

      if (route.from)
        route.path = route.from;

      route.onEnter = function (nextState, transition) {
        var { location, params } = nextState;
        var pathname = route.to ? formatPattern(route.to, params) : location.pathname;

        transition.to(
          pathname,
          route.query || location.query,
          route.state || location.state
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
