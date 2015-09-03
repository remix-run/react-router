import { PropTypes } from 'react';

var { func, object, arrayOf, oneOfType, element, shape, string } = PropTypes;

function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

var history = shape({
  listen: func.isRequired,
  pushState: func.isRequired,
  replaceState: func.isRequired,
  go: func.isRequired
});

var location = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
});

var component = oneOfType([ func, string ]);
var components = oneOfType([ component, object ]);
var route = oneOfType([ object, element ]);
var routes = oneOfType([ route, arrayOf(route) ]);

export default {
  falsy,
  history,
  location,
  component,
  components,
  route,
  router
};
