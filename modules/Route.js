var React = require('react');
var invariant = require('react/lib/invariant');
var { string, bool, func } = React.PropTypes;
var { component, components } = require('./PropTypes');

/**
 * A <Route> is used to declare which components are rendered to the page when
 * the URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is requested,
 * the tree is searched depth-first to find a route whose path matches the URL.
 * When one is found, all routes in the tree that lead to it are considered
 * "active" and their components are rendered into the DOM, nested in the same
 * order as they are in the tree.
 */
class Route extends React.Component {

  static propTypes = {
    name: string,
    path: string,
    ignoreScrollBehavior: bool,
    component,
    components,
    getComponents: func
  }

  render() {
    invariant(
      false,
      '<%s> elements are for router configuration only and should not be rendered',
      this.constructor.name
    );
  }

}

module.exports = Route;
