import React from 'react';
import invariant from 'invariant';
import { stripLeadingSlashes, stringifyQuery } from './URLUtils';

var { func, object } = React.PropTypes;

function pathnameIsActive(pathname, activePathname) {
  pathname = stripLeadingSlashes(pathname);
  activePathname = stripLeadingSlashes(activePathname);

  // perfect match
  if (pathname === activePathname) {
    return true;
  }

  // starts with your path?
  if (activePathname.indexOf(pathname) !== 0) {
    return false;
  }

  // eliminate false-positive when the path section was not finished
  if (activePathname.charAt(pathname.length) !== '/') {
    return false;
  }

  return true;
}

function queryIsActive(query, activeQuery) {
  if (activeQuery == null)
    return query == null;

  if (query == null)
    return true;

  for (var p in query)
    if (query.hasOwnProperty(p) && String(query[p]) !== String(activeQuery[p]))
      return false;

  return true;
}

var RouterContextMixin = {

  propTypes: {
    stringifyQuery: func.isRequired
  },

  getDefaultProps() {
    return {
      stringifyQuery
    };
  },

  childContextTypes: {
    router: object.isRequired
  },

  getChildContext() {
    return {
      router: this
    };
  },

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    if (query) {
      if (typeof query !== 'string')
        query = this.props.stringifyQuery(query);

      if (query !== '')
        return pathname + '?' + query;
    }

    return pathname;
  },

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  makeHref(pathname, query) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history && history.makeHref)
      return history.makeHref(path);

    return path;
  },

  /**
   * Pushes a new Location onto the history stack.
   */
  transitionTo(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#transitionTo is client-side only (needs history)'
    );

    history.pushState(state, this.makePath(pathname, query));
  },

  /**
   * Replaces the current Location on the history stack.
   */
  replaceWith(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#replaceWith is client-side only (needs history)'
    );

    history.replaceState(state, this.makePath(pathname, query));
  },

  /**
   * Navigates forward/backward n entries in the history stack.
   */
  go(n) {
    var { history } = this.props;

    invariant(
      history,
      'Router#go is client-side only (needs history)'
    );

    history.go(n);
  },

  /**
   * Navigates back one entry in the history stack. This is identical to
   * the user clicking the browser's back button.
   */
  goBack() {
    this.go(-1);
  },

  /**
   * Navigates forward one entry in the history stack. This is identical to
   * the user clicking the browser's forward button.
   */
  goForward() {
    this.go(1);
  },

  /**
   * Returns true if a <Link> to the given pathname/query combination is
   * currently active.
   */
  isActive(pathname, query) {
    var { location } = this.state;

    if (location == null)
      return false;

    return pathnameIsActive(pathname, location.pathname) &&
      queryIsActive(query, location.query);
  }

};

export default RouterContextMixin;
