import React from 'react';
module url from './url';
module routeStore from './route-store';

var Route = React.createClass({

  componentWillMount: function() {
    // TODO: should probably do this registration in a <RootRoute/> thing, I'd
    // like to remove them on unmount but then we're removing still valid
    // routes
    registerRoutes(this);
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    url.unsubscribe(this.handleRouteChange);
  },

  getInitialState: function() {
    return {
      activeRoute: this.findActiveRoute()
    };
  },

  findActiveRoute: function() {
    return findActiveRoute(this);
  },

  handleRouteChange: function() {
    this.setState({
      activeRoute: this.findActiveRoute()
    });
  },

  render: function() {
    return this.props.handler({
      activeRoute: this.state.activeRoute
    });
  }
});

function getParams() {
  return { id: 123 };
}

function registerRoutes(route) {
  var children = childrenArray(route);
  if (!children) return;
  for (var i = 0, l = children.length; i < l; i ++) {
    routeStore.register(children[i]);
    // TODO: should be more efficient here, and not register everything
    // multiple times, maybe a <RootRoute/> can handle all the registration
    if (children[i].props.children) {
      registerRoutes(children[i]);
    }
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

function findActiveRoute(route) {
  var children = childrenArray(route);
  var path = url.getPath();
  var match = null;
  if (children) {
    for (var i = 0, l = children.length; i < l; i ++) {
      if (matchRoute(children[i], path)) {
        return children[i].props.handler({
          params: getParams()
        });
      }
      if (children[i].props.children) {
        var matchedGrandchild = findActiveRoute(children[i])
        if (matchedGrandchild) {
          return children[i];
        }
      }
    }
  }
  return null;
}

export default Route;

