import React from 'react';
import { Actions } from 'history';
import { canUseDOM, setWindowScrollPosition } from './DOMUtils';

var { func } = React.PropTypes;

function getCommonAncestors(routes, otherRoutes) {
  return routes.filter(route => otherRoutes.indexOf(route) !== -1);
}

function shouldUpdateScrollPosition(state, prevState) {
  var { location, routes } = state;
  var { location: prevLocation, routes: prevRoutes } = prevState;

  // When an onEnter hook uses transition.to to redirect
  // on the initial load prevLocation is null, so assume
  // we don't want to update the scroll position.
  if (prevLocation === null)
    return false;

  // Don't update scroll position if only the query has changed.
  if (location.pathname === prevLocation.pathname)
    return false;

  // Don't update scroll position if any of the ancestors
  // has `ignoreScrollPosition` set to `true` on the route.
  var sharedAncestors = getCommonAncestors(routes, prevRoutes);
  if (sharedAncestors.some(route => route.ignoreScrollBehavior))
    return false;

  return true;
}

function updateWindowScrollPosition(action, scrollX, scrollY) {
  if (canUseDOM) {
    if (action === Actions.POP) {
      setWindowScrollPosition(scrollX, scrollY);
    } else {
      setWindowScrollPosition(0, 0);
    }
  }
}

var ScrollManagementMixin = {

  propTypes: {
    shouldUpdateScrollPosition: func.isRequired,
    updateScrollPosition: func.isRequired
  },

  getDefaultProps() {
    return {
      shouldUpdateScrollPosition,
      updateScrollPosition: updateWindowScrollPosition
    };
  },

  componentDidUpdate(prevProps, prevState) {
    var { location } = this.state;

    if (location && this.props.shouldUpdateScrollPosition(this.state, prevState)) {
      var { action, scrollX, scrollY } = location;
      this.props.updateScrollPosition(action, scrollX || 0, scrollY || 0);
    }
  }

};

export default ScrollManagementMixin;
