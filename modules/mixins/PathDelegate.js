var React = require('react');
var invariant = require('react/lib/invariant');
var PathState = require('./PathState');
var RouteContainer = require('./RouteContainer');
var HashLocation = require('../locations/HashLocation');
var Path = require('../utils/Path');

/**
 * A mixin for components that manage the current URL path.
 */
var PathDelegate = {

  mixins: [ PathState, RouteContainer ],

  childContextTypes: {
    pathDelegate: React.PropTypes.any.isRequired
  },

  getChildContext: function () {
    return {
      pathDelegate: this
    };
  },

  /**
   * Returns an absolute URL path created from the given route
   * name, URL parameters, and query values.
   */
  makePath: function (to, params, query) {
    var path;
    if (Path.isAbsolute(to)) {
      path = Path.normalize(to);
    } else {
      var route = this.getRouteByName(to);

      invariant(
        route,
        'Unable to find a route named "' + to + '". Make sure you have ' +
        'a <Route name="' + to + '"> defined somewhere in your <Routes>'
      );

      path = route.props.path;
    }

    return Path.withQuery(Path.injectParams(path, params), query);
  },

  /**
   * Returns a string that may safely be used as the href of a
   * link to the route with the given name.
   */
  makeHref: function (to, params, query) {
    var path = this.makePath(to, params, query);

    if (this.getLocation() === HashLocation)
      return '#' + path;

    return path;
  },

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query, sender) {
    sender = sender || this;

    var path = this.makePath(to, params, query);
    var location = this.getLocation();

    // If we have a location, route the transition through it.
    if (location) {
      location.push(path, this);
    } else if (this.updatePath) {
      this.updatePath(path, this);
    }
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query, sender) {
    sender = sender || this;

    var path = this.makePath(to, params, query);
    var location = this.getLocation();

    // If we have a location, route the transition through it.
    if (location) {
      location.replace(path, sender);
    } else if (this.updatePath) {
      this.updatePath(path, sender);
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function (sender) {
    sender = sender || this;

    var location = this.getLocation();

    invariant(
      location,
      'You cannot goBack without a location'
    );

    location.pop(sender);
  }

};

module.exports = PathDelegate;
