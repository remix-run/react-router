var HashLocation = require('../locations/HashLocation');
var LocationActions = require('../actions/LocationActions');
var makePath = require('./makePath');

/**
 * Returns a string that may safely be used as the href of a
 * link to the route with the given name.
 */
function makeHref(to, params, query) {
  var path = makePath(to, params, query);

  if (LocationActions.getLocation() === HashLocation)
    return '#' + path;

  return path;
}

module.exports = makeHref;
