var { string } = require('react').PropTypes;
var { falsy } = require('../PropTypes');
var Route = require('./Route');

/**
 * A <Redirect> is a special kind of <Route> that always redirects
 * to another route when it matches.
 */
class Redirect extends Route {

  static propTypes = {
    path: string,
    from: string, // Alias for path.
    to: string,
    children: falsy,
    component: falsy,
    components: falsy,
    getComponents: falsy
  }

}

module.exports = Redirect;
