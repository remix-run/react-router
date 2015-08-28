import React from 'react';

var { object } = React.PropTypes;

/**
 * The State mixin provides components with an isActive(pathname, query)
 * method they can use to check if a given pathname/query are active.
 *
 * Example:
 *
 *   import { State } from 'react-router';
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ State ],
 *     render() {
 *       var className = this.props.className;
 *
 *       if (this.isActive('/about'))
 *         className += ' is-active';
 *
 *       return React.createElement('a', { className }, this.props.children);
 *     }
 *   });
 */
var State = {

  contextTypes: {
    history: object.isRequired
  },

  isActive(pathname, query, indexOnly) {
    return this.context.history.isActive(pathname, query, indexOnly);
  }

};

export default State;
