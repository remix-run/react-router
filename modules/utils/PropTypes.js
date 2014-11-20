var PropTypes = {

  /**
   * Requires that the value of a prop be falsy.
   */
  falsy: function (props, propName, elementName) {
    if (props[propName])
      return new Error('<' + elementName + '> may not have a "' + propName + '" prop');
  }

};

module.exports = PropTypes;
