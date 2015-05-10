var invariant = require('invariant');
var { isAbsolutePath, withQuery, injectParams, stripLeadingSlashes, stripTrailingSlashes } = require('./PathUtils');

function searchRoutesSync(routes, test) {
  var route, branch;
  for (var i = 0, len = routes.length; i < len; ++i) {
    route = routes[i];

    if (test(route))
      return [ route ];

    if (route.childRoutes && (branch = searchRoutesSync(route.childRoutes, test))) {
      branch.unshift(route);
      return branch;
    }
  }

  return null;
}

function getBranchToRoute(routes, route) {
  return searchRoutesSync(routes, function (r) {
    return r === route;
  });
}

function getBranchToRouteWithName(routes, name) {
  return searchRoutesSync(routes, function (route) {
    return route.name === name;
  });
}

function makePatternFromBranch(branch) {
  return branch.reduce(function (pattern, route) {
    return stripTrailingSlashes(pattern) + '/' + stripLeadingSlashes(route.path);
  }, '');
}

var NavigationMixin = {
  
  /**
   * Returns an absolute URL path created from the given route
   * name, URL parameters, and query.
   */
  makePath(to, params, query) {
    var pattern;
    if (isAbsolutePath(to)) {
      pattern = to;
    } else {
      var routes = this.getRoutes();
      var branch = typeof to === 'string' ? getBranchToRouteWithName(routes, to) : getBranchToRoute(routes, to);

      invariant(
        branch,
        'Cannot find route "%s"',
        to
      );

      pattern = makePatternFromBranch(branch);
    }

    return withQuery(injectParams(pattern, params), query);
  },

  /**
   * Returns a string that may safely be used as the href of a link
   * to the route with the given name, URL parameters, and query.
   */
  makeHref(to, params, query) {
    var path = this.makePath(to, params, query);
    var history = this.getHistory();

    if (history)
      return history.makeHref(path);

    return path;
  },

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo(to, params, query) {
    var history = this.getHistory();

    invariant(
      history,
      'transitionTo() needs history'
    );

    var path = this.makePath(to, params, query);

    if (this.nextLocation) {
      // Replace so pending location does not stay in history.
      history.replace(path);
    } else {
      history.push(path);
    }
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith(to, params, query) {
    var history = this.getHistory();

    invariant(
      history,
      'replaceWith() needs history'
    );

    history.replace(this.makePath(to, params, query));
  },

  go(n) {
    var history = this.getHistory();

    invariant(
      history,
      'go() needs history'
    );

    history.go(n);
  },

  goBack() {
    this.go(-1);
  },

  goForward() {
    this.go(1);
  },

  canGo(n) {
    var history = this.getHistory();

    invariant(
      history,
      'canGo() needs history'
    );

    return history.canGo(n);
  },

  canGoBack() {
    return this.canGo(-1);
  },

  canGoForward() {
    return this.canGo(1);
  }

};

module.exports = NavigationMixin;
