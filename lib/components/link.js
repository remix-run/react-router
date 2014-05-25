import React from 'react';
module urlStore from '../stores/url-store';
module routeStore from '../stores/route-store';
module path from '../path';

var Link = React.createClass({

  statics: {

    makeHref: function (routeName, params) {
      var route = routeStore.getRouteByName(routeName);

      if (!route)
        throw new Error('No route with name: ' + routeName);

      var base = urlStore.getLocation() === 'history' ? '/' : '#/';

      return base + path.forRoute(route, params);
    }

  },

  getInitialState: function() {
    return {
      href: Link.makeHref(this.props.to, this.props),
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
        if (!active[i].params) {
          return true;
        }
        return paramsAreActive(active[i].params, this.props);
      }
    }
    return false;
  },

  componentDidMount: function() {
    // must subscribe in didMount so the subscription is after the RootRoute
    // subscription
    urlStore.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    urlStore.unsubscribe(this.handleRouteChange);
  },

  handleClick: function(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    event.preventDefault();
    urlStore.push(this.state.href);
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

function paramsAreActive(params, props) {
  for (var key in params) {
    if (props[key] !== params[key]) {
      return false;
    }
  }
  return true;
}

export default Link;
