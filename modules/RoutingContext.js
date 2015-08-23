import React from 'react';
import invariant from 'invariant';
import getRouteParams from './getRouteParams';

var { array, func, object } = React.PropTypes;

/**
 * A <RoutingContext> renders the component tree for a given router state
 * and sets the router object and the current location in context.
 */
var RoutingContext = React.createClass({

  propTypes: {
    router: object.isRequired,
    createElement: func.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired
  },

  getDefaultProps() {
    return {
      createElement: React.createElement
    };
  },

  childContextTypes: {
    router: object.isRequired,
    location: object.isRequired
  },

  getChildContext() {
    return {
      router: this.props.router,
      location: this.props.location
    };
  },

  createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props);
  },

  render() {
    var { router, location, routes, params, components } = this.props;
    var element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = routes[index];
        var routeParams = getRouteParams(route, params);
        var props = {
          router,
          location,
          params,
          route,
          routeParams
        };

        if (React.isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this.createElement(components[key], props);

          return elements;
        }

        return this.createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || React.isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default RoutingContext;
