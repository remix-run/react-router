import React from 'react';
import { canUseDOM, setWindowScrollPosition } from './DOMUtils';
import NavigationTypes from './NavigationTypes';

var { func } = React.PropTypes;

function getCommonAncestors(branch, otherBranch) {
  return branch.filter(route => otherBranch.indexOf(route) !== -1);
}

function shouldUpdateScrollPosition(state, prevState) {
  var { location, branch } = state;
  var { location: prevLocation, branch: prevBranch } = prevState;

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
  var sharedAncestors = getCommonAncestors(branch, prevBranch);
  if (sharedAncestors.some(route => route.ignoreScrollBehavior))
    return false;

  return true;
}

function updateWindowScrollPosition(navigationType, scrollX, scrollY) {
  if (canUseDOM) {
    if (navigationType === NavigationTypes.POP) {
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
    var locationState = location && location.state;

    if (locationState && this.props.shouldUpdateScrollPosition(this.state, prevState)) {
      var { scrollX, scrollY } = locationState;

      if (scrollX != null && scrollY != null)
        this.props.updateScrollPosition(location.navigationType, scrollX, scrollY);
    }
  }

};

export default ScrollManagementMixin;
