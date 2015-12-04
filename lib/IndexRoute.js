'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouteUtils = require('./RouteUtils');

var _PropTypes = require('./PropTypes');

var func = _react2['default'].PropTypes.func;

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */

var IndexRoute = (function (_Component) {
  _inherits(IndexRoute, _Component);

  function IndexRoute() {
    _classCallCheck(this, IndexRoute);

    _Component.apply(this, arguments);
  }

  /* istanbul ignore next: sanity check */

  IndexRoute.prototype.render = function render() {
    !false ? process.env.NODE_ENV !== 'production' ? _invariant2['default'](false, '<IndexRoute> elements are for router configuration only and should not be rendered') : _invariant2['default'](false) : undefined;
  };

  return IndexRoute;
})(_react.Component);

IndexRoute.propTypes = {
  path: _PropTypes.falsy,
  component: _PropTypes.component,
  components: _PropTypes.components,
  getComponent: func,
  getComponents: func
};

IndexRoute.createRouteFromReactElement = function (element, parentRoute) {
  /* istanbul ignore else: sanity check */
  if (parentRoute) {
    parentRoute.indexRoute = _RouteUtils.createRouteFromReactElement(element);
  } else {
    process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'An <IndexRoute> does not make sense at the root of your route config') : undefined;
  }
};

exports['default'] = IndexRoute;
module.exports = exports['default'];