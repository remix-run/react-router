var PropTypes = {

  /**
   * Requires that the value of a prop be falsy.
   */
  falsy: function (props, propName, componentName) {
    if (props[propName])
      return new Error('<' + componentName + '> may not have a "' + propName + '" prop');
  }

};

module.exports = PropTypes;
