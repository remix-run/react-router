var { object } = require('react').PropTypes;

/**
 * A mixin for components that need to know the path, routes, URL
 * params and query that are currently active.
 *
 * Example:
 *
 *   var { State } = require('react-router');
 *   var AboutLink = React.createClass({
 *     mixins: [ State ],
 *     render() {
 *       var className = this.props.className;
 *
 *       if (this.isActive('about'))
 *         className += ' is-active';
 *
 *       return React.createElement('a', { className: className }, this.props.children);
 *     }
 *   });
 */
var State = {

  contextTypes: {
    router: object.isRequired
  }

};

var RouterStateMethods = [
  'getLocation',
  'getPath',
  'getPathname',
  'getQuery',
  'getParams',
  'getRoutes',
  'getComponents',
  'isActive'
];

RouterStateMethods.forEach(function (method) {
  State[method] = function () {
    var router = this.context.router;
    return router[method].apply(router, arguments);
  };
});

module.exports = State;
