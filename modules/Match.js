/**
 * A Match is created when a Route matches on a URL path.
 */
function Match(route, params) {
  this.route = route;
  this.params = params;
  this.element = null;
}

module.exports = Match;
