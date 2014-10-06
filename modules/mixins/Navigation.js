var React = require('react');
var invariant = require('react/lib/invariant');
var HashLocation = require('../locations/HashLocation');
var Path = require('../utils/Path');

/**
 * A mixin for components that modify the URL.
 */
var Navigation = {

  contextTypes: {
    location: React.PropTypes.object, // Not required on the server.
    namedRoutes: React.PropTypes.object.isRequired
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
      var route = this.context.namedRoutes[to];

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

    if (this.context.location === HashLocation)
      return '#' + path;

    return path;
  },

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    var location = this.context.location;

    invariant(
      location,
      'You cannot use transitionTo without a location'
    );

    location.push(this.makePath(to, params, query));
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    var location = this.context.location;

    invariant(
      location,
      'You cannot use replaceWith without a location'
    );

    location.replace(this.makePath(to, params, query));
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    var location = this.context.location;

    invariant(
      location,
      'You cannot use goBack without a location'
    );

    location.pop();
  }

};

module.exports = Navigation;
