import React, { Component } from 'react';
import * as RouterPropTypes from './PropTypes';

/**
 * Higher-order component that adds router to context
 * @param  {Router} router
 * @return {ReactComponent}
 */
export default function routerContext(router) {
  return BaseComponent => class RouterContext extends Component {
    static childContextTypes = {
      router: RouterPropTypes.router
    }

    getChildContext() {
      return { router };
    }

    render() {
      return <BaseComponent {...this.props} />;
    }
  }
}
