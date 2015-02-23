"use strict";

var warning = require("react/lib/warning");
var invariant = require("react/lib/invariant");

function checkPropTypes(componentName, propTypes, props) {
  for (var propName in propTypes) {
    if (propTypes.hasOwnProperty(propName)) {
      var error = propTypes[propName](props, propName, componentName);

      if (error instanceof Error) warning(false, error.message);
    }
  }
}

var Configuration = {

  statics: {

    validateProps: function validateProps(props) {
      checkPropTypes(this.displayName, this.propTypes, props);
    }

  },

  render: function render() {
    invariant(false, "%s elements are for router configuration only and should not be rendered", this.constructor.displayName);
  }

};

module.exports = Configuration;