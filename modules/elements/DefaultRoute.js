var React = require('react');
var FakeNode = require('../mixins/FakeNode');
var PropTypes = require('../utils/PropTypes');

/**
 * A <DefaultRoute> component is a special kind of <Route> that
 * renders when its parent matches but none of its siblings do.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
var DefaultRoute = React.createClass({

  displayName: 'DefaultRoute',

  mixins: [ FakeNode ],

  propTypes: {
    path: PropTypes.falsy
  }

});

module.exports = DefaultRoute;
