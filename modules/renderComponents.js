import { isValidElement, createElement as defaultCreateElement } from 'react';
import getRouteParams from './getRouteParams';

/**
 * Returns a React node for given router state
 * @param {RouterState} state
 * @param {Object} props - props to pass to components
 * @param {Object} [createElement] - custom createElement function
 * @return {React.PropTypes.node}
 */
export default function renderComponents(
  state,
  props,
  createElement = defaultCreateElement
) {
  const { routes, params, components } = state;
  let element = null;

  if (components) {
    element = components.reduceRight((element, components, index) => {
      if (components == null)
        return element; // Don't create new children; use the grandchildren.

      var route = routes[index];
      var routeParams = getRouteParams(route, params);
      var componentProps = Object.assign({}, props, { route, routeParams });

      if (isValidElement(element)) {
        props.children = element;
      } else if (element) {
        // In render, do var { header, sidebar } = this.props;
        Object.assign(componentProps, element);
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

  return element;
}
