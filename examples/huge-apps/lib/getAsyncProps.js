import React from 'react';
import assign from 'object-assign';

export default function getAsyncProps (routerProps, cb) {
  var { components, params } = routerProps;
  var asyncPropsArray = new Array(components.length);
  var count = 0;

  function finish () {
    count++;
    if (count === components.length)
      cb(null, injectAsyncProps(routerProps, asyncPropsArray));
  }

  components.forEach((Component, index) => {
    if (typeof Component === 'object') {
      getAsyncPropsForComponentsObject(Component, routerProps, (err, props) => {
        asyncPropsArray[index] = props;
        finish();
      });
    }
    else {
      if (Component.getAsyncProps) {
        Component.getAsyncProps(params, (err, props) => {
          asyncPropsArray[index] = props;
          finish();
        });
      }
      else {
        asyncPropsArray[index] = {};
        finish();
      }
    }
  });
}

function getAsyncPropsForComponentsObject (components, routerProps, callback) {
  var total = Object.keys(components).length;
  var asyncProps = {};
  var count = 0;

  function finish () {
    count++;
    if (count === total)
      callback(null, asyncProps);
  }

  for (let key in components) {
    let Component = components[key];
    if (Component.getAsyncProps) {
      Component.getAsyncProps(routerProps.params, (err, props) => {
        asyncProps[key] = props;
        finish();
      });
    }
    finish();
  }
}

function injectAsyncProps (routerProps, asyncProps) {
  var newComponents = routerProps.components.map((Component, index) => {
    if (typeof Component === 'object') {
      var components = Component;
      var newComponents = {};
      for (let key in components) {
        let Component = components[key];
        newComponents[key] = wrapComponent(Component, asyncProps[index][key]);
      }
      return newComponents;
    }
    else {
      return wrapComponent(Component, asyncProps[index]);
    }
  });
  return assign({}, routerProps, { components: newComponents });
}

function wrapComponent (Component, asyncProps) {
  return asyncProps ? class AsyncPropsWrapper extends React.Component {
    render () {
      return React.createElement(Component, assign({}, this.props, asyncProps));
    }
  } : Component;
}

