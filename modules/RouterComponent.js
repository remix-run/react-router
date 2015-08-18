import invariant from 'invariant';
import React, {
  Component,
  PropTypes,
  createElement,
  isValidElement
} from 'react';
import * as RouterPropTypes from './PropTypes';
import getRouteParams from './getRouteParams';

export default class RouterComponent extends Component {
  static propTypes = {
    routes: RouterPropTypes.routes.isRequired,
    params: PropTypes.object.isRequired,
    location: RouterPropTypes.location.isRequired,
    components: PropTypes.array.isRequired,

    createElement: PropTypes.func
  }

  static defaultProps = {
    createElement
  }

  createElement(component, props) {
    return component ? this.props.createElement(component, props) : null;
  }

  render() {
    const { routes, params, components } = this.props;
    let element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = routes[index];
        var routeParams = getRouteParams(route, params);
        var props = Object.assign({}, this.state, { route, routeParams });

        if (isValidElement(element)) {
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
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }
}
