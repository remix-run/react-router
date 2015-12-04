'use strict';

exports.__esModule = true;
exports.falsy = falsy;

var _react = require('react');

var func = _react.PropTypes.func;
var object = _react.PropTypes.object;
var arrayOf = _react.PropTypes.arrayOf;
var oneOfType = _react.PropTypes.oneOfType;
var element = _react.PropTypes.element;
var shape = _react.PropTypes.shape;
var string = _react.PropTypes.string;

function falsy(props, propName, componentName) {
  if (props[propName]) return new Error('<' + componentName + '> should not have a "' + propName + '" prop');
}

var history = shape({
  listen: func.isRequired,
  pushState: func.isRequired,
  replaceState: func.isRequired,
  go: func.isRequired
});

exports.history = history;
var location = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
});

exports.location = location;
var component = oneOfType([func, string]);
exports.component = component;
var components = oneOfType([component, object]);
exports.components = components;
var route = oneOfType([object, element]);
exports.route = route;
var routes = oneOfType([route, arrayOf(route)]);

exports.routes = routes;
exports['default'] = {
  falsy: falsy,
  history: history,
  location: location,
  component: component,
  components: components,
  route: route
};