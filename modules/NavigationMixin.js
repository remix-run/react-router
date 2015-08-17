import invariant from 'invariant';
import React from 'react';

var { func } = React.PropTypes;

var NavigationMixin = {};

var RouterNavigationMethods = [
  'createPath',
  'createHref',
  'transitionTo',
  'replaceWith',
  'go',
  'goBack',
  'goForward'
];

RouterNavigationMethods.forEach(function (method) {
  NavigationMixin[method] = function () {
    var router = this.router;
    return router[method].apply(router, arguments);
  };
});

export default NavigationMixin;
