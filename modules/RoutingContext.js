import invariant from 'invariant';
import { components, routes } from './PropTypes';
import React, { isValidElement } from 'react';
import { branchMatches, makePath, makeHref} from './RoutingUtils';
import { queryContains } from './URLUtils';

var { any, arrayOf, bool, object, func } = React.PropTypes;

function createElement(component, props) {
  return (typeof component === 'function') ? React.createElement(component, props) : null;
}

export var RoutingContext = React.createClass({

  propTypes: {
    stringifyQuery: func,
    history: object,
    routerContext: object,
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

  childContextTypes: {
    router: object.isRequired
  },

  getChildContext() {
    return {
      router: Object.assign({}, this.props.routerContext, {
        makeHref: this.makeHref,
        makePath: this.makePath,
        isActive: this.isActive,
      })
    };
  },

  isActive(pathname, query) {
    return branchMatches(this.state.branch, pathname) && queryContains(this.state.query, query);
  },

  makePath(pathname, query) {
    return makePath(pathname, query, this.props.stringifyQuery);
  },

  makeHref(pathname, query) {
    var { stringifyQuery, history } = this.props;
    return makeHref(pathname, query, stringifyQuery, history);
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

  componentDidUpdate() {
    // TODO: Update scroll position
    // TODO: Move onUpdate hook to here?
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
