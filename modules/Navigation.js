import React from 'react';

var { object } = React.PropTypes;

/**
 * The Navigation mixin provides methods for components
 * that need to modify the URL.
 *
 * Example:
 *
 *   import { Navigation } from 'react-router';
 *
 *   var MyLink = React.createClass({
 *     mixins: [ Navigation ],
 *     handleClick(event) {
 *       event.preventDefault();
 *       this.transitionTo('/the/path', { the: 'query' });
 *     },
 *     render() {
 *       return (
 *         <a onClick={this.handleClick}>Click me!</a>
 *       );
 *     }
 *   });
 */
var Navigation = {

  contextTypes: {
    router: object.isRequired
  },

  transitionTo(pathname, query, state) {
    return this.context.router.pushState(state, pathname, query);
  },

  replaceWith(pathname, query, state) {
    return this.context.router.replaceState(state, pathname, query);
  }

};

var RouterNavigationMethods = [
  'createPath',
  'createHref',
  'go',
  'goBack',
  'goForward'
];

RouterNavigationMethods.forEach(function (method) {
  Navigation[method] = function () {
    var router = this.context.router;
    return router[method].apply(router, arguments);
  };
});

export default Navigation;
