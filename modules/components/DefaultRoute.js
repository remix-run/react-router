var { string, func } = require('react').PropTypes;
var { falsy, component, components } = require('../PropTypes');
var Route = require('./Route');

/**
 * A <DefaultRoute> is a special kind of <Route> that renders
 * when its parent matches but none of its siblings do. Only one
 * such route may be used at any given level in the route tree.
 */
class DefaultRoute extends Route {

  static propTypes = {
    name: string,
    path: falsy,
    children: falsy,
    component,
    components,
    getComponents: func
  }

}

module.exports = DefaultRoute;
