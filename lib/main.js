var Link = require('./components/link');
var Route = require('./components/route');
var Routes = require('./components/routes');
var urlStore = require('./stores/url-store');

function transitionTo(routeName, params, query) {
  urlStore.push(Link.makeHref(routeName, params, query));
}

function replaceWith(routeName, params, query) {
  urlStore.replace(Link.makeHref(routeName, params, query));
}

module.exports = {
  Link: Link,
  Route: Route,
  Routes: Routes,
  transitionTo: transitionTo,
  replaceWith: replaceWith
};

