var { func, arrayOf, instanceOf, oneOfType } = require('react').PropTypes;
var Location = require('./Location');

function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`);
}

var component = func;
var components = oneOfType([ component, arrayOf(component) ]);
var location = instanceOf(Location);

module.exports = {
  falsy,
  component,
  components,
  location
};
