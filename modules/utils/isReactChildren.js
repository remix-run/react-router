var React = require('react');

function isReactChildren(object) {
  return React.isValidElement(object) ||
    (Array.isArray(object) && object.every(React.isValidElement));
}

module.exports = isReactChildren;
