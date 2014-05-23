import React from 'react';
import Routes from './routes';
import Route from './route';
import Link from './link';
import url from './url';
import makeHref from './make-href';
module store from './route-store';

export function transitionTo(name, props) {
  var href = makeHref(name, props);
  url.push(href);
}

export function replaceWith(name, props) {
  var href = makeHref(name, props);
  url.replace(href);
}

export function getCurrentInfo() {
  var active = store.getActive();
  var last = active[active.length - 1];
  return {
    name: last.route.props.name,
    params: last.params
  };
}

export {
  Link,
  Route,
  location,
  Routes
};

