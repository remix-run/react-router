var { func, object, arrayOf, instanceOf, oneOfType } = require('react').PropTypes;
var AbstractHistory = require('./AbstractHistory');
var Location = require('./Location');

function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

var component = func;
var components = oneOfType([ component, object ]);
var history = instanceOf(AbstractHistory);
var location = instanceOf(Location);
var route = object;

module.exports = {
  falsy,
  component,
  components,
  history,
  location,
  route
};
