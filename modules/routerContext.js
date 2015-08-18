import React, { Component } from 'react';
import * as RouterPropTypes from './PropTypes';

/**
 * Higher-order component that adds router and history to context
 * @param  {Router} router
 * @param  {History} history
 * @return {ReactComponent}
 */
export default function routerContext(router, history) {
  return BaseComponent => class RouterContext extends Component {
    static childContextTypes = {
      router: RouterPropTypes.router,
      history: RouterPropTypes.history
    }

    getChildContext() {
      return {
        router,
        history
      };
    }

    render() {
      return <BaseComponent {...this.props} />;
    }
  }
}
