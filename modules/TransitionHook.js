import React from 'react';
import warning from 'warning';

var { object } = React.PropTypes;

var TransitionHook = {

  contextTypes: {
    router: object.isRequired
  },

  componentDidMount() {
    warning(
      typeof this.routerWillLeave === 'function',
      'Components that mixin TransitionHook should have a routerWillLeave method, check %s',
      this.constructor.displayName || this.constructor.name
    );

    if (this.routerWillLeave)
      this.context.router.addTransitionHook(this.routerWillLeave);
  },

  componentWillUnmount() {
    if (this.routerWillLeave)
      this.context.router.removeTransitionHook(this.routerWillLeave);
  }

};

export default TransitionHook;
