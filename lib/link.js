import React from 'react';
module url from './url';
module routeStore from './route-store';

var Link = React.createClass({

  getInitialState: function() {
    return {
      href: '',
      isActive: this.isActive()
    };
  },

  handleRouteChange: function() {
    this.setState({
      isActive: this.isActive()
    });
  },

  isActive: function() {
    var active = routeStore.getActive();
    for (var i = 0, l = active.length; i < l; i++) {
      if (this.props.to === active[i].route.props.name) {
        return true;
      }
    }
    return false;
  },

  componentDidMount: function() {
    this.handleRouteChange();
    // must subscribe in didMount so the subscription is after the RootRoute
    // subscription
    url.subscribe(this.handleRouteChange);
    this.setState({
      href: this.makeHref()
    });
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleRouteChange);
  },

  handleClick: function(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    url.push(this.state.href);
  },

  makeHref: function() {
    var route = routeStore.lookup(this.props.to);
    if (!route) {
      return;
      //throw new Error('No route found for `'+this.props.to+'`');
    }
    var base = '#/'+route.props.path;
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

  className: function() {
    var className = this.props.className || '';
    if (this.state.isActive) {
      className += ' active';
    }
    return className;
  },

  render: function() {
    return React.DOM.a({
      href: this.state.href,
      onClick: this.handleClick,
      className: this.className()
    }, this.props.children);
  }
});

export default Link;

