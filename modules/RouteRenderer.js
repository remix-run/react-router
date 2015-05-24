import React from 'react';
import passMiddlewareProps from './passMiddlewareProps';
import Location from './Location';
import invariant from 'invariant';
import assign from 'object-assign';

var { createElement } = React;
var { element, object, any, instanceOf } = React.PropTypes;

export default class RouteRenderer extends React.Component {

  static propTypes = {
    params: object.isRequired,
    query: any.isRequired,
    location: instanceOf(Location).isRequired,
    children: element
  };

  render () {
    var { location, params, query } = this.props;

    var element = this.props.branch.reduceRight(function (element, route, index) {
      var components = route.component || route.components;

      if (components == null)
        return element; // Don't create new children; use the grandchildren.

      var props = { location, params, query, route };

      if (React.isValidElement(element)) {
        props.children = element;
      } else if (element) {
        // In render, use children like:
        // var { header, sidebar } = this.props;
        assign(props, element);
      }

      if (typeof components === 'object') {
        var elements = {};
        for (var key in components)
          if (components.hasOwnProperty(key))
            elements[key] = createElement(components[key], assign({}, props));
        return elements;
      }

      return createElement(components, props);
    }, element);

    invariant(
      React.isValidElement(element),
      'The root route must render a single component'
    );

    return passMiddlewareProps(this.props, { element });
  }

}

