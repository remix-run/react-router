import React from 'react';
module url from './url';
module routeTree from './route-tree';

var Link = React.createClass({

  getInitialState: function() {
    return {
      href: null,
      isActive: false
    };
  },

  componentDidMount: function() {
    this.setState({
      href: this.makeHref()
    });
  },

  componentWillMount: function() {
    url.subscribe(this.handleUrlChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleUrlChange);
  },

  handleUrlChange: function() {
    this.setState({
      isActive: url.getPath() === this.state.href //pathIsActive(this.props.to)
    });
  },

  handleClick: function(event) {
    event.preventDefault();
    url.push(this.state.href);
  },

  makeHref: function() {
    var route = routeTree.lookup(this.props.to);
    if (!route) {
      throw new Error('No route found for `'+this.props.to+'`');
    }
    return route.props.path;
  },

  render: function() {
    return React.DOM.a({
      href: this.state.href,
      onClick: this.handleClick,
      className: this.state.isActive ? 'active' : ''
    }, this.props.children);
  }
});

export default Link;

