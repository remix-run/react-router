import React from 'react';
import passMiddlewareProps from './passMiddlewareProps';

// TODO: make this thing actually work ... Dan.
export default class RestoreScroll extends React.Component {

  static propTypes = {
    children: React.PropTypes.element
  };

  render () {
    return passMiddlewareProps(this.props, {});
  }

}

