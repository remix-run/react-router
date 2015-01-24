var invariant = require('react/lib/invariant');

var NonRenderable = {

  render: function () {
    invariant(
      false,
      '%s elements should not be rendered',
      this.constructor.displayName
    );
  }

};

module.exports = NonRenderable;
