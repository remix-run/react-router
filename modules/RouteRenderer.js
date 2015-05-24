import React from 'react';
import passMiddlewareProps from './passMiddlewareProps';
import Location from './Location';
var { element, object, any } = React.PropTypes;

export default class RouteRenderer extends React.Component {

  static propTypes = {
    params: object.isRequired,
    query: any.isRequired,
    location: instanceOf(Location).isRequired,
    children: element
  };

  render () {
    var element = null;
    return passMiddlewareProps(this.props, {
      element
    });
  }

}

