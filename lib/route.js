import React from 'react';
module routeStore from './route-store';

var Route = React.createClass({

  getInitialState: function() {
    return {};
  },

  render: function() {
    return this.props.handler();
  }

});

export default Route;

