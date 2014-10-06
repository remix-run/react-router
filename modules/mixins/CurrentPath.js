var React = require('react');

/**
 * A mixin for components that need to know the current URL path.
 *
 * Example:
 *
 *   var ShowThePath = React.createClass({
 *     mixins: [ Router.CurrentPath ],
 *     render: function () {
 *       return (
 *         <div>The current path is: {this.getCurrentPath()}</div>
 *       );
 *     }
 *   });
 */
var CurrentPath = {

  contextTypes: {
    currentPath: React.PropTypes.string.isRequired
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return this.context.currentPath;
  }

};

module.exports = CurrentPath;
