var React = require('react');
var warning = require('react/lib/warning');

function Router(route) {
  warning(
    false,
    'The Router(<Route>).renderComponent(container) interface is deprecated and ' +
    'will be removed soon. Use React.renderComponent(<Route>, container) instead'
  );

  return {
    renderComponent: function (container, callback) {
      return React.renderComponent(route, container, callback);
    }
  };
}

module.exports = Router;
