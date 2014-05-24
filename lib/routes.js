import React from 'react';
import Route from './route';
import url from './url';
import routeStore from './route-store';

var Routes = React.createClass({

  propTypes: {
    handler: React.PropTypes.component.isRequired,
    location: React.PropTypes.string
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
    url.setup(this.getLocation());
  },

  componentWillUnmount: function() {
    routeStore.unregisterRoot(this);
    url.unsubscribe(this.handleRouteChange);
    url.teardown();
  },

  getLocation: function () {
    return this.props.location || 'hash';
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
      var lastHandlerInstance;
      var lastHandler;
      var lastParams;
      active.slice(0).reverse().forEach(function(info) {
        var props = {};
        if (lastHandlerInstance) {
          props.activeRoute = lastHandlerInstance;
          props.ActiveRoute = lastHandler;
        } else {
          // make sure transitioning to the same route with new
          // params causes an update
          props.key = url.getPath();
        }
        if (lastParams) {
          props.activeParams = lastParams;
        }
        if (info.params) {
          lastParams = info.params;
          for (var name in info.params) {
            props[name] = info.params[name];
          }
        }
        lastHandler = info.route.props.handler;
        lastHandlerInstance = info.route.props.handler(props);
      });
    }
    if (lastParams) {
      props.activeParams = lastParams;
    }
    props.ActiveRoute = lastHandler;
    props.activeRoute = lastHandlerInstance;
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

