/**
 * A Route couples a URL path with a ReactElement class
 * that is rendered when that URL matches its path.
 */
function Route(handler, name) {
  this.handler = handler;
  this.name = name;
  this.path = null;
  this.paramNames = null;
  this.defaultRoute = null;
  this.notFoundRoute = null;
  this.childRoutes = null;
}

module.exports = Route;
