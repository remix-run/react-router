var { object } = require('react').PropTypes;

/**
 * A mixin for components that modify the URL.
 *
 * Example:
 *
 *   var { Navigation } = require('react-router');
 *   var MyLink = React.createClass({
 *     mixins: [ Navigation ],
 *     handleClick(event) {
 *       event.preventDefault();
 *       this.transitionTo('aRoute', { the: 'params' }, { the: 'query' });
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
  'makePath',
  'makeHref',
  'transitionTo',
  'replaceWith',
  'go',
  'goBack',
  'goForward',
  'canGo',
  'canGoBack',
  'canGoForward'
];

RouterNavigationMethods.forEach(function (method) {
  Navigation[method] = function () {
    var router = this.context.router;
    return router[method].apply(router, arguments);
  };
});

module.exports = Navigation;
