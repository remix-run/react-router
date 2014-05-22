import React from 'react';
var map = {};
var active = [];

export function registerRoot(root) {
  eachChild(root, register);
}

export function unregisterRoot(root) {
  eachChild(root, unregister);
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

export function setActive(arr) {
  active = arr;
}

export function getActive() {
  return active;
}

function eachChild(component, iterator) {
  React.Children.forEach(component.props.children, iterator);
}

