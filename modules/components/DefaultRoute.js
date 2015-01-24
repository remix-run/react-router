var React = require('react');
var NonRenderable = require('../NonRenderable');
var PropTypes = require('../PropTypes');

/**
 * A <DefaultRoute> component is a special kind of <Route> that
 * renders when its parent matches but none of its siblings do.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
var DefaultRoute = React.createClass({

  displayName: 'DefaultRoute',

  mixins: [ NonRenderable ],

  propTypes: {
    name: PropTypes.string,
    path: PropTypes.falsy,
    handler: PropTypes.func.isRequired
  }

});

module.exports = DefaultRoute;
