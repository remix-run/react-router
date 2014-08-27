var renderRoutes = require('./renderRoutes');

var renderRoutesToString = function (routes, fullPath) {
  return renderRoutes(routes, fullPath, false);
};

module.exports = renderRoutesToString;