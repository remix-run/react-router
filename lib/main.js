import React from 'react';
module url from './url';
url.init();

var Routes = React.createClass({

  getInitialState: function() {
    return {
      activeRoute: this.findActiveRoute()
    };
  },

  componentDidMount: function() {
    url.subscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    this.setState(this.getInitialState());
  },

  findActiveRoute: function() {
    var path = url.getPath();
    var routes = this.props.children;
    for (var i = 0, l = routes.length; i < l; i ++) {
      if (path === routes[i].props.path) {
        return routes[i];
      }
    }
    return null;
  },

  render: function() {
    return this.state.activeRoute;
  }
});

var Route = React.createClass({
  render: function() {
    return this.props.handler();
  }
});

export { Routes, Route };

