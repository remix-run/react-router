import React from 'react';
module url from './url';
module routeStore from './route-store';

var Route = React.createClass({

  componentWillMount: function() {
    registerChildren(this);
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    unregisterChildren(this);
    url.unsubscribe(this.handleRouteChange);
  },

  getInitialState: function() {
    return {
      activeRoute: this.findActiveRoute()
    };
  },

  findActiveRoute: function() {
    var children = childrenArray(this);
    var path = url.getPath();
    var match = null;
    if (children) {
      for (var i = 0, l = children.length; i < l; i ++) {
        if (matchRoute(children[i], path)) {
          return children[i].props.handler();
        };
      }
    }
    return null;
  },

  handleRouteChange: function() {
    this.setState({
      activeRoute: this.findActiveRoute()
    });
  },

  render: function() {
    return this.props.handler({activeRoute: this.state.activeRoute});
  }
});

function registerChildren(route) {
  var children = childrenArray(route);
  if (!children) return;
  for (var i = 0, l = children.length; i < l; i ++) {
    routeStore.register(children[i]);
  }
}

function unregisterChildren(route) {
  var children = childrenArray(route);
  if (!children) return;
  for (var i = 0, l = children.length; i < l; i ++) {
    routeStore.unregister(children[i]);
  }
}

function matchRoute(route, path) {
  return route.props.path === path;
}

function childrenArray(component) {
  var children = component.props.children;
  if (!children) return false;
  return Array.isArray(children) ? children : [children];
}

export default Route;

