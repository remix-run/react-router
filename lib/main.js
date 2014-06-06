var Link = require('./components/link');
var Route = require('./components/route');
var Router = require('./router');
var Routes = require('./components/routes');
var urlStore = require('./stores/url-store');

function transitionTo(routeName, params, query) {
  urlStore.push(Link.makeHref(routeName, params, query));
}

function replaceWith(routeName, params, query) {
  urlStore.replace(Link.makeHref(routeName, params, query));
}

function useHistory() {
  urlStore.setup('history');
}

module.exports = {
  Link: Link,
  Route: Route,
  Router: Router,
  Routes: Routes,
  transitionTo: transitionTo,
  replaceWith: replaceWith,
  useHistory: useHistory
};

