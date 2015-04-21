"use strict";

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var PropTypes = require("../PropTypes");
var RouteHandler = require("./RouteHandler");
var Route = require("./Route");

/**
 * A <NotFoundRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */

var NotFoundRoute = (function (_Route) {
  function NotFoundRoute() {
    _classCallCheck(this, NotFoundRoute);

    if (_Route != null) {
      _Route.apply(this, arguments);
    }
  }

  _inherits(NotFoundRoute, _Route);

  return NotFoundRoute;
})(Route);

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

NotFoundRoute.propTypes = {
  name: PropTypes.string,
  path: PropTypes.falsy,
  children: PropTypes.falsy,
  handler: PropTypes.func.isRequired
};

NotFoundRoute.defaultProps = {
  handler: RouteHandler
};

module.exports = NotFoundRoute;