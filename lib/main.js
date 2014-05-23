var React = require('react');
var Routes = require('./routes');
var Route = require('./route');
var Link = require('./link');
var url = require('./url');
var makeHref = require('./make-href');

function transitionTo(name, props) {
  var href = makeHref(name, props);
  url.push(href);
}

function replaceWith(name, props) {
  var href = makeHref(name, props);
  url.replace(href);
}

module.exports = {
  transitionTo: transitionTo,
  replaceWith: replaceWith,
  Link: Link,
  Route: Route,
  location: location,
  Routes: Routes
};
