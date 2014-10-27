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
