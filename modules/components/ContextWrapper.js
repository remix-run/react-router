/**
 * This component is necessary to get around a context warning
 * present in React 0.13.0. It sovles this by providing a separation
 * between the "owner" and "parent" contexts.
 */

var React = require('react');
var PropTypes = require('../PropTypes');

class ContextWrapper extends React.Component {

  getChildContext() {
    return {
      router: this.context.router,
      routeDepth: this.context.routeDepth
    };
  }

  render() {
    return this.props.children;
  }
}

ContextWrapper.contextTypes = {
  routeDepth: PropTypes.number.isRequired,
  router: PropTypes.router.isRequired
};

ContextWrapper.childContextTypes = {
  routeDepth: PropTypes.number.isRequired,
  router: PropTypes.router.isRequired
};

module.exports = ContextWrapper;
