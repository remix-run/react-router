import React from 'react';
import PropTypes from './PropTypes';
import NavigationTypes from './NavigationTypes';
import passMiddlewareProps from './passMiddlewareProps';

var canUseDOM = !!(
  (typeof window !== 'undefined' &&
  window.document && window.document.createElement)
);

function getCommonAncestors(branch, otherBranch) {
  return branch.filter(route => otherBranch.indexOf(route) !== -1);
}

function shouldUpdateScrollPositionByDefault(props, prevProps) {
  var { location, branch } = props;
  var { location: prevLocation, branch: prevBranch } = prevProps;

  // Don't update scroll position if only the query has changed.
  if (prevLocation.path === location.path)
    return false;

  // Don't update scroll position if any of the ancestors
  // has `ignoreScrollPosition` set to `true` on the route.
  var sharedAncestors = getCommonAncestors(branch, prevBranch);
  if (sharedAncestors.some(route => route.ignoreScrollBehavior))
    return false;

  return true;
}

function restoreScrollPosition(scrollPosition, navigationType) {
  if (navigationType === NavigationTypes.POP && scrollPosition != null) {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  } else {
    window.scrollTo(0, 0);
  }
}

export default class ScrollManager extends React.Component {

  static defaultProps = {
    updateScrollPosition: restoreScrollPosition,
    shouldUpdateScrollPosition: shouldUpdateScrollPositionByDefault
  };

  static propTypes = {
    children: React.PropTypes.element,
    location: PropTypes.location,
    branch: React.PropTypes.array,
    updateScrollPosition: React.PropTypes.func.isRequired,
    shouldUpdateScrollPosition: React.PropTypes.func.isRequired
  };

  componentDidUpdate(prevProps) {
    if (!canUseDOM || !this.props.location || !this.props.branch)
      return;

    if (this.props.shouldUpdateScrollPosition(this.props, prevProps)) {
      var { scrollPosition, navigationType } = this.props.location;
      this.props.updateScrollPosition(scrollPosition, navigationType);
    }
  }

  render () {
    return passMiddlewareProps(this.props, {});
  }

}

