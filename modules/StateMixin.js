var PathUtils = require('./PathUtils');

function routeIsActive(activeRoutes, route) {
  if (typeof route === 'object')
    return activeRoutes.indexOf(route) !== -1;

  return activeRoutes.some(function (r) {
    return r.name === route;
  });
}

function paramsAreActive(activeParams, params) {
  for (var property in params)
    if (String(activeParams[property]) !== String(params[property]))
      return false;

  return true;
}

function queryIsActive(activeQuery, query) {
  if (activeQuery == null)
    return false;

  for (var property in query)
    if (String(activeQuery[property]) !== String(query[property]))
      return false;

  return true;
}

var StateMixin = {

  getLocation() {
    return this.state.location;
  },

  getPath() {
    return this.getLocation().path;
  },

  getPathname() {
    return PathUtils.getPathname(this.getLocation());
  },

  getQueryString() {
    return PathUtils.getQueryString(this.getLocation());
  },

  getQuery() {
    return PathUtils.getQuery(this.getLocation());
  },

  getBranch() {
    return this.state.branch;
  },

  getParams() {
    return this.state.params;
  },

  getComponents() {
    return this.state.components;
  },

  isActive(to, params, query) {
    if (!this.getLocation())
      return false;

    if (PathUtils.isAbsolutePath(to))
      return to === this.getPath();

    return routeIsActive(this.getBranch(), to) &&
      paramsAreActive(this.getParams(), params) &&
      (query == null || queryIsActive(this.getQuery(), query));
  }

};

module.exports = StateMixin;
