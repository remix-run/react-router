var invariant = require('react/lib/invariant');
var RouteHandler = require('./components/RouteHandler');

var Configuration = {

  getDefaultProps() {
    return {
      handler: RouteHandler
    };
  },

  render() {
    invariant(
      false,
      '%s elements are for router configuration only and should not be rendered',
      this.constructor.displayName
    );
  }

};

module.exports = Configuration;
