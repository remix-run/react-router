import React from 'react';

export default function passMiddlewareProps (parentProps, extraProps) {
  var props = Object.assign({}, parentProps, extraProps);
  var child = React.Children.only(parentProps.children);
  delete props.children;
  return React.cloneElement(child, props);
}

