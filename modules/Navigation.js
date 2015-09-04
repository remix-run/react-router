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
    history: object.isRequired
  },

  transitionTo(pathname, query, state) {
    return this.context.history.pushState(state, pathname, query);
  },

  replaceWith(pathname, query, state) {
    return this.context.history.replaceState(state, pathname, query);
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
    var { history } = this.context;
    return history[method].apply(history, arguments);
  };
});

export default Navigation;
