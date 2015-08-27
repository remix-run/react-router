import React from 'react';

var { object } = React.PropTypes;

/**
 * A mixin for components that modify the URL.
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
  }

};

var RouterNavigationMethods = [
  'createPath',
  'createHref',
  'transitionTo',
  'replaceWith',
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
