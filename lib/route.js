import React from 'react';

var Route = React.createClass({

  propTypes: {
    name: React.PropTypes.string,
    path: React.PropTypes.string,
    handler: React.PropTypes.component.isRequired
  },

  render: function() {
    return;
  }

});

export default Route;
