var React = require('react');
var LocationActions = require('../actions/LocationActions');

/**
 * A <TransitionTo> component will transition to the route specified
 * in the `to` or `name` prop with specified `params` and `query`
 */
var TransitionTo = React.createClass({
  getInitialState: function() {
    return {
      redirected: false
    };
  },

  componentDidMount: function() {
    this.redirect();
  },

  componentDidUpdate: function() {
    this.redirect();
  },

  redirect: function() {
    if (this.state.redirected) {
      return;
    }

    this.setState({
      redirected: true
    });

    LocationActions.transitionTo(this.props.to || this.props.name, this.props.params, this.props.query);
  },

  render: function() {
    return null;
  }
});

module.exports = TransitionTo;
