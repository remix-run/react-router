import React from 'react';
module url from './url';
module routeStore from './route-store';

var Link = React.createClass({

  getInitialState: function() {
    return {
      href: ''
    };
  },

  componentDidMount: function() {
    // in didMount so its after routes rendered at the same time, routes
    // register on the route store in willMount
    var href = this.makeHref();
    this.setState({
      href: href
    });
  },

  handleClick: function(event) {
    event.preventDefault();
    url.push(this.state.href);
  },

  makeHref: function() {
    var route = routeStore.lookup(this.props.to);
    if (!route) {
      throw new Error('No route found for `'+this.props.to+'`');
    }
    return route.props.path;
  },

  render: function() {
    return React.DOM.a({
      href: this.state.href,
      onClick: this.handleClick
    }, this.props.children);
  }
});

export default Link;

