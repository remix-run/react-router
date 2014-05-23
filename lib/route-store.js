var React = require('React');

var map = {};
var active = [];

function registerRoot(root) {
  map = {};
  eachChild(root, register);
}

function unregisterRoot(root) {
  eachChild(root, unregister);
}

function register(route) {
  map[route.props.name] = route;
  if (route.props.children) {
    eachChild(route, register);
  }
}

function unregister(route) {
  delete map[route.props.name];
}

function lookup(name) {
  return map[name];
}

function lookupAll() {
  return map;
}

function setActive(arr) {
  active = arr;
}

function getActive() {
  return active;
}

function eachChild(component, iterator) {
  React.Children.forEach(component.props.children, iterator);
}

module.exports = {
  registerRoot: registerRoot,
  unregisterRoot: unregisterRoot,
  register: register,
  unregister: unregister,
  lookup: lookup,
  lookupAll: lookupAll,
  setActive: setActive,
  getActive: getActive,
  eachChild: eachChild
};
