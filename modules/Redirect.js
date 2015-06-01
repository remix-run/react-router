import React from 'react';
import Route from './Route';
import createRouteFromReactElement from './RouteUtils';
import { falsy } from './PropTypes';

var { string } = React.PropTypes;

class Redirect extends Route {

  static createRouteFromReactElement(element) {
    var route = createRouteFromReactElement(element);

    if (route.from)
      route.path = route.from;

    route.onEnter = function (nextState, router) {
      // TODO: This is awkward, but the query doesn't live in state
      // so we need some way to get it here so we can preserve it.
      router.replaceWith(route.to, router.getQuery(nextState.location.path));
    };

    return route;
  }
  
  static propTypes = {
    from: string,
    to: string.isRequired,
    onEnter: falsy,
    children: falsy
  };
  
}

export default Redirect;
