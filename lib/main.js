import React from 'react';
import Routes from './routes';
import Route from './route';
import Link from './link';
import url from './url';
import makeHref from './make-href';

export function transitionTo(name, props) {
  var href = makeHref(name, props);
  url.push(href);
}

export function replaceWith(name, props) {
  var href = makeHref(name, props);
  url.replace(href);
}

export {
  Link,
  Route,
  location,
  Routes
};

