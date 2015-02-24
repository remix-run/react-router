var assign = require('react/lib/Object.assign');
var ReactPropTypes = require('react').PropTypes;

var PropTypes = assign({

  /**
   * Requires that the value of a prop be falsy.
   */
  falsy(props, propName, componentName) {
    if (props[propName])
      return new Error('<' + componentName + '> may not have a "' + propName + '" prop');
  }

}, ReactPropTypes);

module.exports = PropTypes;
