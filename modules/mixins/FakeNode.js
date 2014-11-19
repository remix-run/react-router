var invariant = require('react/lib/invariant');

var FakeNode = {

  render: function () {
    invariant(
      false,
      '%s elements should not be rendered',
      this.constructor.displayName
    );
  }

};

module.exports = FakeNode;
