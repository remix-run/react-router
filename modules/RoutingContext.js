import invariant from 'invariant';
import { components, routes } from './PropTypes';
import React, { isValidElement } from 'react';

var { any, arrayOf, bool, object } = React.PropTypes;

function createElement(component, props) {
  return (typeof component === 'function') ? React.createElement(component, props) : null;
}

export var RoutingContext = React.createClass({

  propTypes: {
    location: any,
    branch: routes,
    params: object,
    query: object,
    components: arrayOf(components),
    isTransitioning: bool
  },

  getInitialState() {
    return {
      location: null,
      branch: null,
      params: null,
      query: null,
      components: null,
      isTransitioning: false
    };
  },

  _updateState(props) {
    // TODO: This is our chance to pause the world.
    this.setState(props);
  },

  componentWillMount() {
    this._updateState(this.props);
  },

  componentWillReceiveProps(nextProps) {
    this._updateState(nextProps);
  },

  render() {
    var { location, branch, params, query, components, isTransitioning } = this.state;
    var element = null;

    if (components) {
      element = components.reduceRight(function (element, components, index) {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = branch[index];
        var props = { location, params, query, route, isTransitioning };

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, use children like:
          // var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = createElement(components[key], props);

          return elements;
        }

        return createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default RoutingContext;
