import React from 'react';
import createDecorator from './DecoratorUtils';

var { object } = React.PropTypes;

/**
 * The IsActive mixin provides components with an isActive(pathname, query)
 * method they can use to check if a given pathname/query are active.
 *
 * Example:
 *
 *   import { IsActive } from 'react-router';
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ IsActive ],
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
var IsActive = {

  contextTypes: {
    history: object.isRequired
  },

  isActive(pathname, query, indexOnly) {
    return this.context.history.isActive(pathname, query, indexOnly);
  }

};

export const IsActiveDecorator = createDecorator(IsActive);

export default IsActive;
