var React = require('react');
var NonRenderable = require('../NonRenderable');
var PropTypes = require('../PropTypes');

/**
 * A <NotFoundRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
var NotFoundRoute = React.createClass({

  displayName: 'NotFoundRoute',

  mixins: [ NonRenderable ],

  propTypes: {
    name: PropTypes.string,
    path: PropTypes.falsy,
    handler: PropTypes.func.isRequired
  }

});

module.exports = NotFoundRoute;
