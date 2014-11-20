var React = require('react');
var FakeNode = require('../mixins/FakeNode');
var PropTypes = require('../utils/PropTypes');

/**
 * A <NotFoundRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
var NotFoundRoute = React.createClass({

  displayName: 'NotFoundRoute',

  mixins: [ FakeNode ],

  propTypes: {
    path: PropTypes.falsy
  }

});

module.exports = NotFoundRoute;
