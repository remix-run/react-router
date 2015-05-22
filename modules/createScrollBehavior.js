var React = require('react');
var PropTypes = require('./PropTypes');

var canUseDOM = !!(
  (typeof window !== 'undefined' &&
  window.document && window.document.createElement)
);

function getCommonAncestors(branch, otherBranch) {
  return branch.filter(route => otherBranch.indexOf(route) !== -1);
}

function createScrollBehavior(applyScrollPosition) {
  class ScrollBehavior extends React.Component {
    static propTypes = {
      location: PropTypes.location.isRequired,
      branch: React.PropTypes.arrayOf(PropTypes.route.isRequired).isRequired,
      children: React.PropTypes.element.isRequired
    }

    componentDidUpdate(prevProps) {
      if (!canUseDOM)
        return;

      var { location, branch } = this.props;
      var { location: prevLocation, branch: prevBranch } = prevProps;

      // Don't update scroll position when only the query has changed.
      if (prevLocation.getPathname() === location.getPathname())
        return;

      // Don't apply scroll position if any of the ancestors
      // has `ignoreScrollPosition` set to `true` on the route.
      var sharedAncestors = getCommonAncestors(branch, prevBranch);
      if (sharedAncestors.some(route => route.ignoreScrollBehavior))
        return;

      applyScrollPosition(location);
    }

    render() {
      return React.Children.only(this.props.children);
    }
  }

  return ScrollBehavior;
}

module.exports = createScrollBehavior;