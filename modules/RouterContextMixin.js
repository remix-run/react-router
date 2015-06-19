import React from 'react';
import invariant from 'invariant';
import { stripLeadingSlashes, stringifyQuery } from './URLUtils';

var { func, object } = React.PropTypes;

function pathnameIsActive(pathname, activePathname) {
  if (stripLeadingSlashes(activePathname).indexOf(stripLeadingSlashes(pathname)) === 0)
    return true; // This quick comparison satisfies most use cases.

  // TODO: Implement a more stringent comparison that checks
  // to see if the pathname matches any routes (and params)
  // in the currently active branch.

  return false;
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
