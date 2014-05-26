var React = require('react');
var routeStore = require('../stores/route-store');
var urlStore = require('../stores/url-store');

var Routes = React.createClass({

  propTypes: {
    handler: React.PropTypes.component.isRequired,
    location: React.PropTypes.string
  },

  getInitialState: function() {
    return {
      currentPath: null,
      activeRoutes: [],
      activeParams: {}
    };
  },

  componentWillMount: function() {
    routeStore.storeRoutes(this);
    urlStore.subscribe(this.handleRouteChange);
    urlStore.setup(this.getLocation());
  },

  componentWillUnmount: function() {
    urlStore.unsubscribe(this.handleRouteChange);
    urlStore.teardown();
  },

  getLocation: function () {
    return this.props.location || 'hash';
  },

  handleRouteChange: function() {
    var currentPath = urlStore.getCurrentPath();
    routeStore.updateActive(currentPath);

    this.setState({
      currentPath: currentPath,

      // TODO: Should we update these in componentWillReceiveProps instead?
      activeRoutes: routeStore.getActiveRoutes(),
      activeParams: routeStore.getActiveParams(),
      activeQuery: routeStore.getActiveQuery()
    });
  },

  reservedProps: ['handler', 'location'],

  getUnreservedProps: function () {
    var props = {};

    for (var name in this.props) {
      if (this.reservedProps.indexOf(name) === -1) {
        props[name] = this.props[name];
      }
    }

    return props;
  },

  render: function () {
    var activeRoutes = this.state.activeRoutes;
    var activeParams = this.state.activeParams;
    var activeQuery = this.state.activeQuery;

    var lastHandler, LastHandler;

    reversedArray(activeRoutes).forEach(function (route) {
      var props = { params: activeParams, query: activeQuery };

      if (lastHandler) {
        props.activeRoute = lastHandler;
        props.ActiveRoute = LastHandler;
      } else {
        // make sure transitioning to the same route with new
        // params causes an update
        props.key = urlStore.getCurrentPath();
      }

      LastHandler = route.props.handler;
      lastHandler = LastHandler(props);
    });

    var props = this.getUnreservedProps();

    props.ActiveRoute = LastHandler;
    props.activeRoute = lastHandler;
    props.params = activeParams;

    return this.props.handler(props);
  }

});

function reversedArray(array) {
  return array.slice(0).reverse();
}

module.exports = Routes;

