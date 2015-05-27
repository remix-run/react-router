/**
 * Encapsulates a redirect to the given route.
 */
function Redirect(to, params, query, data) {
  this.to = to;
  this.params = params;
  this.query = query;
  this.data = data;
}

module.exports = Redirect;
