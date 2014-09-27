var React = require('react');

/**
 * A mixin for components that need to initiate transitions to other routes.
 */
var Transitions = {

  contextTypes: {
    pathDelegate: React.PropTypes.any.isRequired
  },

  /**
   * See PathDelegate#transitionTo.
   */
  transitionTo: function (to, params, query) {
    return this.context.pathDelegate.transitionTo(to, params, query, this);
  },

  /**
   * See PathDelegate#replaceWith.
   */
  replaceWith: function (to, params, query) {
    return this.context.pathDelegate.replaceWith(to, params, query, this);
  },

  /**
   * See PathDelegate#goBack.
   */
  goBack: function () {
    return this.context.pathDelegate.goBack(this);
  }

};

module.exports = Transitions;
