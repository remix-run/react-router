/**
 * This component is necessary to get around a context warning
 * present in React 0.13.0. It sovles this by providing a separation
 * between the "owner" and "parent" contexts.
 */

var React = require('react');

class ContextWrapper extends React.Component {

  render() {
    return React.Children.only(this.props.children);
  }

}

module.exports = ContextWrapper;
