import React from 'react';

var { object } = React.PropTypes;

/**
 * A mixin for components that need to know the path, routes, URL
 * params and query that are currently active.
 *
 * Example:
 *
 *   import { State } from 'react-router';
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ State ],
 *     render() {
 *       var className = this.props.className;
 *
 *       if (this.isActive('/about'))
 *         className += ' is-active';
 *
 *       return React.createElement('a', { className }, this.props.children);
 *     }
 *   });
 */
var State = {

  contextTypes: {
    router: object.isRequired
  }

};

var RouterStateMethods = [
  'isActive'
];

RouterStateMethods.forEach(function (method) {
  State[method] = function () {
    var router = this.context.router;
    return router[method].apply(router, arguments);
  };
});

export default State;
