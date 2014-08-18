var renderRoutes = require('./renderRoutes');

var renderRoutesToStaticMarkup = function (routes, fullPath) {
  return renderRoutes(routes, fullPath, true);
};

module.exports = renderRoutesToStaticMarkup;