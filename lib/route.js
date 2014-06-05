var React = require('react');
var mergeInto = require('react/lib/mergeInto');
var invariant = require('react/lib/invariant');
var path = require('./path');

/**
 * A Route specifies a component that will be rendered to the page when the URL
 * matches a given pattern. Routes may also be named, which makes it easy for
 * <Link> components to refer to them.
 * 
 * Routes are arranged in a nested tree structure. Likewise, when a route's component
 * is rendered, it is nested inside all of its ancestor routes.
 *
 * Unlike Ember, a nested route's URL pattern does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URL patterns, but it
 * has the nice benefit of decoupling nested UI from nested URL segments.
 * 
 *   var appRoute = route('/', App, function (route) {
 *     route('/posts', Posts, function (route) {
 *       route('newComment', '/posts/new', NewPost);
 *       route('showComment', '/posts/:id', Post);
 *     });
 *   });
 *   
 *   appRoute.match('/posts/123'); => [ { route: <AppRoute>, params: {} },
 *                                      { route: <PostsRoute>, params: {} },
 *                                      { route: <PostRoute>, params: { id: '123' } }
 *                                    ]
 */
function Route(name, pattern, component, callback) {
  if (!(this instanceof Route))
    return new Route(name, pattern, component, callback);

  // If pattern is omitted, it defaults to the name.
  if (React.isValidComponent(pattern)) {
    callback = component;
    component = pattern;
    pattern = name;
  }

  invariant(
    React.isValidComponent(component),
    'Route "' + name + '" must have a valid React component'
  );

  this.name = name;
  this.pattern = path.normalize(pattern);
  this.component = component;
  this.childRoutes = [];

  if (typeof callback === 'function') {
    invariant(
      callback.length === 1,
      'A route callback should have one argument, a function that is usually named "route". ' +
      'You may have forgotten to include this argument when writing out nested routes like ' +
      'route("/", App, function (/* missing "route" argument here! */) { ... })'
    );

    callback(this.addChild.bind(this));
  }
}

mergeInto(Route.prototype, {

  /**
   * Adds a child route with the given arguments to this route.
   */
  addChild: function (name, path, component, callback) {
    var route = new Route(name, path, component, callback);
    this.childRoutes.push(route);
    return route;
  },

  /**
   * Searches this Route and its subtree depth-first for a Route that matches on
   * the given path. Returns an array of all routes in the tree leading to the one
   * that matched in the format { route, params } where params is an object that
   * contains the URL parameters relevant to that route.
   */
  match: function (currentPath) {
    var childRoutes = this.childRoutes, matches;

    // Search the subtree first to find the most deeply-nested route.
    for (var i = 0, length = childRoutes.length; i < length; ++i) {
      matches = childRoutes[i].match(currentPath);

      if (matches.length) {
        var rootMatch = matches[matches.length - 1];
        var rootRoute = rootMatch.route;
        var rootParams = rootMatch.params;

        var paramNames = path.extractParamNames(this.pattern);
        var params = {};

        paramNames.forEach(function (paramName) {
          // Ensure the child route contains all dynamic segments in this route. 
          // TODO: We should probably do this when routes are first declared.
          invariant(
            rootParams[paramName],
            'Route pattern "' + rootRoute.pattern + '" does not contain all parameters ' +
            'of its ancestor pattern "' + this.pattern + '", so they cannot be nested'
          );

          params[paramName] = rootParams[paramName];
        });

        matches.unshift(createMatch(this, params));

        return matches;
      }
    }

    // No routes in the subtree matched, so check this route.
    var params = path.extractParams(this.pattern, currentPath);

    if (params)
      return [ createMatch(this, params) ];

    return [];
  }

});

function createMatch(route, params) {
  return { route: route, params: params };
}

module.exports = Route;
