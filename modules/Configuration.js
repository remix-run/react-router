var invariant = require('react/lib/invariant');

var Configuration = {

  render: function () {
    invariant(
      false,
      '%s elements are for router configuration only and should not be rendered',
      this.constructor.displayName
    );
  }

};

module.exports = Configuration;
