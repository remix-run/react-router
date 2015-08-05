import React from 'react';
import Location from './Location';
import History from './History';

var { func, object, arrayOf, instanceOf, oneOfType, element } = React.PropTypes;

export function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

export var component = func;
export var components = oneOfType([ component, object ]);
export var history = instanceOf(History);
export var location = instanceOf(Location);
export var route = oneOfType([ object, element ]);
export var routes = oneOfType([ route, arrayOf(route) ]);
