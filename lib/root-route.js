import React from 'react';
import url from './url';
import routeStore from './route-store';

var RootRoute = React.createClass({

  getInitialState: function() {
    return {
      activeRoute: null
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
    var activeRoute;
    var currentPath = url.getPath();
    React.Children.forEach(this.props.children, function(child) {
      if (activeRoute) return;
      if (child.props.path === currentPath) {
        activeRoute = child;
      }
    });
    if (!activeRoute) {
      console.warn('no routes matched '+ url.getPath());
      return;
    }
    this.setState({
      activeRoute: activeRoute
    });
  },

  render: function() {
    var props = {};
    if (this.state.activeRoute) {
      props.activeRoute = this.state.activeRoute.props.handler();
    }
    return this.props.handler(props);
  }

});

export default RootRoute;

