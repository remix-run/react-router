var { func, object, string, arrayOf, instanceOf, oneOfType, shape } = require('react').PropTypes;
var AbstractHistory = require('./AbstractHistory');

function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

var component = func;
var components = oneOfType([ component, arrayOf(component) ]);
var history = instanceOf(AbstractHistory);
var route = object;
var location = shape({
  path: string.isRequired,
  navigationType: string
});

module.exports = {
  falsy,
  component,
  components,
  history,
  route,
  location
};
