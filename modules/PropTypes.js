import { PropTypes } from 'react';

var { func, object, arrayOf, oneOfType, element, shape, string } = PropTypes;

export function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

export var history = shape({
  listen: func.isRequired,
  pushState: func.isRequired,
  replaceState: func.isRequired,
  go: func.isRequired
});

export var location = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
});

export var component = oneOfType([ func, string ]);
export var components = oneOfType([ component, object ]);
export var route = oneOfType([ object, element ]);
export var routes = oneOfType([ route, arrayOf(route) ]);
