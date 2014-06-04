var Link = require('./components/link');
var Route = require('./components/route');
var Routes = require('./components/routes');
var urlStore = require('./stores/url-store');

function transitionTo(routeName, params) {
  urlStore.push(Link.makeHref(routeName, params));
}

function replaceWith(routeName, params) {
  urlStore.replace(Link.makeHref(routeName, params));
}

module.exports = {
  Link: Link,
  Route: Route,
  Routes: Routes,
  transitionTo: transitionTo,
  replaceWith: replaceWith
};

