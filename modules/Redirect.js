import React from 'react';
import invariant from 'invariant';
import { createRouteFromReactElement } from './RouteUtils';
import { falsy } from './PropTypes';

var { string } = React.PropTypes;

export var Redirect = React.createClass({

  statics: {

    createRouteFromReactElement(element) {
      var route = createRouteFromReactElement(element);

      if (route.from)
        route.path = route.from;

      route.onEnter = function (nextState, router) {
        router.replaceWith(route.to, nextState.query);
      };

      return route;
    }

  },
  
  propTypes: {
    from: string,
    to: string.isRequired,
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
