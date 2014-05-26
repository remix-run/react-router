var Link = require('./components/link');
var Route = require('./components/route');
var Routes = require('./components/routes');
var routeStore = require('./stores/route-store');
var urlStore = require('./stores/url-store');

function transitionTo(routeName, params) {
  urlStore.push(Link.makeHref(routeName, params));
}

function replaceWith(routeName, params) {
  urlStore.replace(Link.makeHref(routeName, params));
}

function getCurrentInfo() {
  return {
    route: routeStore.getActiveRoute(),
    params: routeStore.getActiveParams()
  };
}

module.exports = {
  Link: Link,
  Route: Route,
  Routes: Routes,
  transitionTo: transitionTo,
  replaceWith: replaceWith,
  getCurrentInfo: getCurrentInfo
};

