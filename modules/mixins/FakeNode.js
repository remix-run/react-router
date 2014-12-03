var invariant = require('react/lib/invariant');

var FakeNode = {

  render: function () {
    ("production" !== process.env.NODE_ENV ? invariant(
      false,
      '%s elements should not be rendered',
      this.constructor.displayName
    ) : invariant(false));
  }

};

module.exports = FakeNode;
