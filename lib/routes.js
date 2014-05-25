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
    return {
      activeRoutes: []
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
    this.setState({
      activeRoutes: routeStore.updateActive(url.getPath(), this)
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
        if (info.params) {
          lastParams = info.params;
        }
        if (lastParams) {
          // all active routes get the same params
          props.params = lastParams;
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

export default Routes;
