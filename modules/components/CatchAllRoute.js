var { string, func } = require('react').PropTypes;
var { falsy, component, components } = require('../PropTypes');
var Route = require('./Route');

/**
 * A <CatchAllRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
class CatchAllRoute extends Route {

  static propTypes = {
    name: string,
    path: falsy,
    children: falsy,
    component,
    components,
    getComponents: func
  }

}

module.exports = CatchAllRoute;
