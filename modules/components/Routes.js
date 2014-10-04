var React = require('react');
var TransitionHandler = require('../mixins/TransitionHandler');

/**
 * The <Routes> component configures the route hierarchy and renders the
 * route matching the current location when rendered into a document.
 *
 * See the <Route> component for more details.
 */
var Routes = React.createClass({

  displayName: 'Routes',

  mixins: [ TransitionHandler ],

  render: function () {
    var match = this.state.matches[0];

    if (match == null)
      return null;

    return match.route.props.handler(
      this.getHandlerProps()
    );
  }

});

module.exports = Routes;
