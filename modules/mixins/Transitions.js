var React = require('react');

/**
 * A mixin for components that need to initiate transitions to other routes.
 */
var Transitions = {

  contextTypes: {
    pathDelegate: React.PropTypes.any.isRequired
  },

  /**
   * See PathDelegate#makePath.
   */
  makePath: function (to, params, query) {
    return this.context.pathDelegate.makePath(to, params, query);
  },

  /**
   * See PathDelegate#makeHref.
   */
  makeHref: function (to, params, query) {
    return this.context.pathDelegate.makeHref(to, params, query);
  },

  /**
   * See PathDelegate#transitionTo.
   */
  transitionTo: function (to, params, query) {
    return this.context.pathDelegate.transitionTo(to, params, query);
  },

  /**
   * See PathDelegate#replaceWith.
   */
  replaceWith: function (to, params, query) {
    return this.context.pathDelegate.replaceWith(to, params, query);
  },

  /**
   * See PathDelegate#goBack.
   */
  goBack: function () {
    return this.context.pathDelegate.goBack();
  }

};

module.exports = Transitions;
