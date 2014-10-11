/**
 * Encapsulates a <Route> that matches the URL path.
 */
function Match(route, params) {
  this.route = route;
  this.params = params;
  this.isStale = false;
  this.component = null;
  this.props = null;
}

module.exports = Match;
