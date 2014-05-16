import React from 'react';
module routeTree from './route-tree';
module url from './url';

var Routes = React.createClass({

  getInitialState: function() {
    return {
      activeHandler: this.findActiveHandler()
    };
  },

  componentWillMount: function() {
    routeTree.storeFromComponent(this);
  },

  componentDidMount: function() {
    url.subscribe(this.handleRouteChange);
  },

  handleRouteChange: function() {
    this.setState({
      activeHandler: this.findActiveHandler()
    });
  },

  findActiveHandler: function() {
    var path = url.getPath();
    var routes = this.props.children;
    for (var i = 0, l = routes.length; i < l; i ++) {
      if (path === routes[i].props.path) {
        return routes[i].props.handler;
      }
    }
    throw new Error('No route found for path `'+path+'`');
  },

  render: function() {
    return this.state.activeHandler();
  }
});

export default Routes;

