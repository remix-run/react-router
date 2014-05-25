import React from 'react';
module routeStore from '../stores/route-store';
module urlStore from '../stores/url-store';
import Route from './route';

var Routes = React.createClass({

  propTypes: {
    handler: React.PropTypes.component.isRequired,
    location: React.PropTypes.string
  },

  getInitialState: function() {
    return {
      currentPath: null,
      activeRoutes: []
    };
  },

  componentWillMount: function() {
    routeStore.registerRoot(this);
    urlStore.subscribe(this.handleRouteChange);
    urlStore.setup(this.getLocation());
  },

  componentWillUnmount: function() {
    routeStore.unregisterRoot(this);
    urlStore.unsubscribe(this.handleRouteChange);
    urlStore.teardown();
  },

  getLocation: function () {
    return this.props.location || 'hash';
  },

  handleRouteChange: function() {
    var currentPath = urlStore.getCurrentPath();

    this.setState({
      currentPath: currentPath,
      // TODO: Should we update this in componentWillReceiveProps instead?
      activeRoutes: routeStore.updateActive(currentPath, this)
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
          props.key = urlStore.getCurrentPath();
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

export default Routes;
