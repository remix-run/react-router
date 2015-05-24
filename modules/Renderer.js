import React from 'react';
var { element } = React.PropTypes;

export default class Renderer extends React.Component {

  static propTypes = {
    element: element
  };

  render () {
    return this.props.element;
  }

}

