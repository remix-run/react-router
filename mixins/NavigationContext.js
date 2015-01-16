var React = require('react');

/**
 * Provides the router with context for Router.Navigation.
 */
var NavigationContext = {

  childContextTypes: {
    makePath: React.PropTypes.func.isRequired,
    makeHref: React.PropTypes.func.isRequired,
    transitionTo: React.PropTypes.func.isRequired,
    replaceWith: React.PropTypes.func.isRequired,
    goBack: React.PropTypes.func.isRequired
  },

  getChildContext: function () {
    return {
      makePath: this.constructor.makePath,
      makeHref: this.constructor.makeHref,
      transitionTo: this.constructor.transitionTo,
      replaceWith: this.constructor.replaceWith,
      goBack: this.constructor.goBack
    };
  }

};

module.exports = NavigationContext;
