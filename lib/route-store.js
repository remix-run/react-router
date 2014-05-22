import React from 'react';
var map = {};

export function registerRoot(root) {
  eachChild(root, register);
}

export function register(route) {
  console.log('registering', route.props.name);
  map[route.props.name] = route;
  if (route.props.children) {
    eachChild(route, register);
  }
}

export function unregister(route) {
  delete map[route.props.name];
}

export function lookup(name) {
  return map[name];
}

export function lookupAll() {
  return map;
}

function eachChild(component, iterator) {
  React.Children.forEach(component.props.children, iterator);
}

