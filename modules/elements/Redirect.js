var React = require('react');
var FakeNode = require('../mixins/FakeNode');
var PropTypes = require('../utils/PropTypes');

/**
 * A <Redirect> component is a special kind of <Route> that always
 * redirects to another route when it matches.
 */
var Redirect = React.createClass({

  displayName: 'Redirect',

  mixins: [ FakeNode ],

  propTypes: {
    path: React.PropTypes.string,
    from: React.PropTypes.string, // Alias for path.
    to: React.PropTypes.string,
    handler: PropTypes.falsy
  }

});

module.exports = Redirect;
