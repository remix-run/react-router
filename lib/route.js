import React from 'react';

var Route = React.createClass({
  render: function() {
    return this.props.handler();
  }
});

export default Route;

