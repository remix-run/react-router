var React = require('react');
var mergeInto = require('react/lib/mergeInto');
var invariant = require('react/lib/invariant');
var path = require('./path');

/**
 * A Router specifies a component that will be rendered to the page when the URL
 * matches a given pattern. Routers may also be named, which makes it easy for
 * <Link> components to link to them.
 * 
 * Routers are arranged in a nested tree structure. Likewise, when a router's component
 * is rendered, it is nested inside all components of its ancestor routers.
 *
 * Unlike Ember, a nested router's URL pattern does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URL patterns, but it
 * has the nice benefit of decoupling nested UI from nested URL segments.
 * 
 *   var AppRouter = Router('/', App, function (route) {
 *     route('/posts', Posts, function (route) {
 *       route('newComment', '/posts/new', NewPost);
 *       route('showComment', '/posts/:id', Post);
 *     });
 *   });
 *   
 *   AppRouter.match('/posts/123'); => [ { router: <AppRouter>, params: {} },
 *                                       { router: <PostsRouter>, params: {} },
 *                                       { router: <PostRouter>, params: { id: '123' } }
 *                                     ]
 */
function Router(name, pattern, component, callback) {
  if (!(this instanceof Router))
    return new Router(name, pattern, component, callback);

  // If pattern is omitted, it defaults to the name.
  if (React.isValidComponent(pattern)) {
    callback = component;
    component = pattern;
    pattern = name;
  }

  invariant(
    React.isValidComponent(component),
    'Router "' + name + '" must have a valid React component'
  );

  this.name = name;
  this.pattern = path.normalize(pattern);
  this.component = component;
  this.childRouters = [];

  if (typeof callback === 'function') {
    invariant(
      callback.length === 1,
      'A Router callback should have one argument, a function that is usually named "route". ' +
      'You may have forgotten to include this argument when writing out nested routers like ' +
      'Router("/", App, function (/* missing "route" argument here! */) { ... })'
    );

    callback(this.route.bind(this));
  }
}

mergeInto(Router.prototype, {

  /**
   * Adds a child router with the given arguments to this router and returns the
   * newly created child router.
   */
  route: function (name, path, component, callback) {
    var router = new Router(name, path, component, callback);
    this.childRouters.push(router);
    return router;
  },

  /**
   * Searches this Router and its subtree depth-first for a Router that matches on
   * the given path. Returns an array of all routes in the tree leading to the one
   * that matched in the format { route, params } where params is an object that
   * contains the URL parameters relevant to that route.
   */
  match: function (currentPath) {
    var childRouters = this.childRouters, matches;

    // Search the subtree first to find the most deeply-nested route.
    for (var i = 0, length = childRouters.length; i < length; ++i) {
      matches = childRouters[i].match(currentPath);

      if (matches.length) {
        var rootMatch = matches[matches.length - 1];
        var rootRouter = rootMatch.router;
        var rootParams = rootMatch.params;

        var paramNames = path.extractParamNames(this.pattern);
        var params = {};

        paramNames.forEach(function (paramName) {
          // Ensure the child route contains all dynamic segments in this route. 
          // TODO: We should probably do this when routes are first declared.
          invariant(
            rootParams[paramName],
            'Router pattern "' + rootRouter.pattern + '" does not contain all parameters ' +
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

function createMatch(router, params) {
  return { router: router, params: params };
}

module.exports = Router;
