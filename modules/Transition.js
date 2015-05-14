var { object } = require('react').PropTypes;

/**
 * A mixin for components that need to observe transitions.
 *
 * Example:
 *
 *   var { Transition } = require('react-router');
 *   
 *   var MyComponent = React.createClass({
 *     mixins: [ Transition ],
 *     transitionHook(router) {
 *       if (this.refs.textInput.getValue() !== '' && prompt('Are you sure?'))
 *         router.cancelTransition();
 *     },
 *     componentDidMount() {
 *       this.addTransitionHook(this.transitionHook);
 *     },
 *     componentWillUnmount() {
 *       this.removeTransitionHook(this.transitionHook);
 *     },
 *     render() {
 *       return (
 *         <div>
 *           <input ref="textInput" type="text"/>
 *         </div>
 *       );
 *     }
 *   });
 */
var Transition = {

  contextTypes: {
    router: object.isRequired
  }

};

var RouterTransitionMethods = [
  'cancelTransition',
  'retryLastCancelledTransition',
  'addTransitionHook',
  'removeTransitionHook'
];

RouterTransitionMethods.forEach(function (method) {
  Transition[method] = function () {
    var router = this.context.router;
    return router[method].apply(router, arguments);
  };
});

module.exports = Transition;
