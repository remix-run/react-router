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
      return;
      //throw new Error('No route found for `'+this.props.to+'`');
    }
    var base = route.props.path;
    if (base.indexOf(':') === -1) {
      return base;
    }
    return base.split('/').map(function(segment) {
      if (segment.indexOf(':') === -1) {
        return segment;
      }
      var name = segment.substr(1);
      if (!this.props[name]) throw new Error('you need a property named '+name+' on this Link');
      return this.props[name];
    }, this).join('/');
  },

  render: function() {
    return React.DOM.a({
      href: this.state.href,
      onClick: this.handleClick
    }, this.props.children);
  }
});

export default Link;

