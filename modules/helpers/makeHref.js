var URLStore = require('../stores/URLStore');
var makePath = require('./makePath');

/**
 * Returns a string that may safely be used as the href of a
 * link to the route with the given name.
 */
function makeHref(routeName, params, query) {
  var path = makePath(routeName, params, query);

  if (URLStore.getLocation() === 'hash')
    return '#' + path;

  return path;
}

module.exports = makeHref;
