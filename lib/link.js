module url from './url';
module activeRoutes from './active-routes';
import React from 'react';

var Link = React.createClass({

  getInitialState: function() {
    return {
      isActive: pathIsActive(this.props.to)
    };
  },

  componentWillMount: function() {
    url.subscribe(this.handleUrlChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleUrlChange);
  },

  handleUrlChange: function() {
    this.setState({
      isActive: pathIsActive(this.props.to)
    });
  },

  handleClick: function(event) {
    event.preventDefault();
    url.push(this.props.to);
  },

  render: function() {
    return React.DOM.a({
      href: this.props.to,
      onClick: this.handleClick,
      className: this.state.isActive ? 'active' : ''
    }, this.props.children);
  }
});

function pathIsActive(path) {
  var currentPath = url.getPath();
  return activeRoutes.pathIsActive(path);
}

export { Link };
