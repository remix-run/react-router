import React from 'react';
import assign from 'object-assign';

export default function passMiddlewareProps (parentProps, extraProps) {
  var props = assign({}, parentProps, extraProps);
  var child = React.Children.only(parentProps.children);
  delete props.children;
  return React.cloneElement(child, props);
}

