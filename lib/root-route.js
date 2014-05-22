import React from 'react';
import url from './url';
import routeStore from './route-store';

var RootRoute = React.createClass({

  getInitialState: function() {
    return {
      activeRoutes: findActiveRoutes(this)
    };
  },

  componentWillMount: function() {
    routeStore.registerRoot(this);
  },

  componentDidMount: function() {
    this.handleRouteChange();
    url.subscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    var active = findActiveRoutes(this);
    this.setState({
      activeRoutes: active
    });
  },

  render: function() {
    var props = {};
    var active = this.state.activeRoutes;
    if (active.length) {
      var lastHandler;
      active.reverse().forEach(function(info) {
        var props = {};
        if (lastHandler) {
          props.activeRoute = lastHandler;
        }
        if (info.params) {
          props.params = info.params;
        }
        lastHandler = info.route.props.handler(props);
      });
    }
    props.activeRoute = lastHandler;
    return this.props.handler(props);
  }

});

// please pull request this monstrosity!
function findActiveRoutes(route, active) {
  var isRoot = !route.props.path; // ghetto
  var currentPath = url.getPath();
  var currentSegments = currentPath.split('/');
  active = active || [];
  React.Children.forEach(route.props.children, function(child) {
    var routePath = child.props.path;
    if (routePath === currentPath) {
      if (!isRoot) {
        active.push({route: route});
      }
      active.push({route: child});
      return;
    }
    var routeSegments = routePath.split('/');
    if (currentSegments.length === routeSegments.length) {
      var builtPath = [];
      var params = {};
      routeSegments.forEach(function(segment, i) {
        var isDynamic = segment.charAt(0) === ':';
        if (segment === currentSegments[i] || isDynamic) {
          builtPath.push(currentSegments[i]);
        }
        if (isDynamic) {
          params[segment.substr(1)] = currentSegments[i];
        }
      });
      if (builtPath.join('/') === currentPath) {
        if (!isRoot) {
          active.push({route: route});
        }
        var info = {route: child};
        if (routePath.indexOf(':') !== -1) {
          info.params = params;
        }
        active.push(info);
      }
    }
    if (child.props.children) {
      findActiveRoutes(child, active);
    }
  });
  return active;
}

export default RootRoute;

