import React from 'react';
import Route from './route';
import url from './url';
import routeStore from './route-store';

var Routes = React.createClass({

  statics: {

    setup: function (location) {
      url.setup(location);
    }

  },

  getInitialState: function() {
    var activeRoutes = findActiveRoutes(this);
    routeStore.setActive(activeRoutes);
    return {
      activeRoutes: activeRoutes
    };
  },

  componentWillMount: function() {
    routeStore.registerRoot(this);
    url.subscribe(this.handleRouteChange);
  },

  componentWillUnmount: function() {
    routeStore.unregisterRoot(this);
    url.unsubscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    var activeRoutes = findActiveRoutes(this);
    routeStore.setActive(activeRoutes);
    this.setState({
      activeRoutes: activeRoutes
    });
  },

  reservedProps: ['handler', 'location'],

  render: function() {
    var props = {};
    for (var name in this.props) {
      if (this.reservedProps.indexOf(name) === -1) {
        props[name] = this.props[name];
      }
    }
    var active = this.state.activeRoutes;
    if (active.length) {
      var lastHandler;
      active.slice(0).reverse().forEach(function(info) {
        var props = {};
        if (lastHandler) {
          props.activeRoute = lastHandler;
        }
        if (info.params) {
          for (var name in info.params) {
            props[name] = info.params[name];
          }
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
  active = active || [];
  var currentPath = url.getPath();
  if (currentPath === '') {
    return active;
  }
  var isRoot = !route.props.path; // ghetto
  var currentSegments = currentPath.split('/');
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

export default Routes;

