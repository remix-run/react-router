import warning from 'warning';
import invariant from 'invariant';
import { createClass, PropTypes } from 'react';
import { createRouteFromReactElement } from './RouteUtils';
import { component, components } from './PropTypes';

var { string, bool, func } = PropTypes;

/**
 * A <Route> is used to declare which components are rendered to the page when
 * the URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is requested,
 * the tree is searched depth-first to find a route whose path matches the URL.
 * When one is found, all routes in the tree that lead to it are considered
 * "active" and their components are rendered into the DOM, nested in the same
 * order as they are in the tree.
 */
var Route = createClass({

  statics: {

    createRouteFromReactElement(element) {
      var route = createRouteFromReactElement(element);

      if (route.handler) {
        warning(false, '<Route handler> is deprecated, use <Route component> instead');
        route.component = route.handler;
        delete route.handler;
      }

      return route;
    }
  
  },

  propTypes: {
    path: string,
    ignoreScrollBehavior: bool,
    handler: component,
    component,
    components,
    getComponents: func
  },

  render() {
    invariant(
      false,
      '<Route> elements are for router configuration only and should not be rendered'
    );
  }

});

export default Route;
