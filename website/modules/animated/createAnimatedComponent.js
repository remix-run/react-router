/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
"use strict";

var React = require("react");
var AnimatedProps = require("./AnimatedProps");
var ApplyAnimatedValues = require("./injectable/ApplyAnimatedValues");

function createAnimatedComponent(Component: any): any {
  class AnimatedComponent extends React.Component {
    _propsAnimated: AnimatedProps;

    componentWillUnmount() {
      this._propsAnimated && this._propsAnimated.__detach();
    }

    setNativeProps(props) {
      var didUpdate = ApplyAnimatedValues.current(
        this.componentRef,
        props,
        this
      );
      if (didUpdate === false) {
        this.forceUpdate();
      }
    }

    componentWillMount() {
      this.attachProps(this.props);
    }

    attachProps(nextProps) {
      var oldPropsAnimated = this._propsAnimated;

      // The system is best designed when setNativeProps is implemented. It is
      // able to avoid re-rendering and directly set the attributes that
      // changed. However, setNativeProps can only be implemented on leaf
      // native components. If you want to animate a composite component, you
      // need to re-render it. In this case, we have a fallback that uses
      // forceUpdate.
      var callback = () => {
        var didUpdate = ApplyAnimatedValues.current(
          this.componentRef,
          this._propsAnimated.__getAnimatedValue(),
          this
        );
        if (didUpdate === false) {
          this.forceUpdate();
        }
      };

      this._propsAnimated = new AnimatedProps(nextProps, callback);

      // When you call detach, it removes the element from the parent list
      // of children. If it goes to 0, then the parent also detaches itself
      // and so on.
      // An optimization is to attach the new elements and THEN detach the old
      // ones instead of detaching and THEN attaching.
      // This way the intermediate state isn't to go to 0 and trigger
      // this expensive recursive detaching to then re-attach everything on
      // the very next operation.
      oldPropsAnimated && oldPropsAnimated.__detach();
    }

    componentWillReceiveProps(nextProps) {
      this.attachProps(nextProps);
    }

    render() {
      const { style, ...other } = this._propsAnimated.__getValue();

      return (
        <Component
          {...other}
          style={ApplyAnimatedValues.transformStyles(style)}
          ref={node => {
            this.componentRef = node;
          }}
        />
      );
    }

    getNode() {
      return this.componentRef;
    }
  }
  AnimatedComponent.propTypes = {
    style: function(props, propName, componentName) {
      if (!Component.propTypes) {
        return;
      }

      // TODO(lmr): We will probably bring this back in at some point, but maybe
      // just a subset of the proptypes... We should have a common set of props
      // that will be used for all platforms.
      //
      // for (var key in ViewStylePropTypes) {
      //   if (!Component.propTypes[key] && props[key] !== undefined) {
      //     console.error(
      //       'You are setting the style `{ ' + key + ': ... }` as a prop. You ' +
      //       'should nest it in a style object. ' +
      //       'E.g. `{ style: { ' + key + ': ... } }`'
      //     );
      //   }
      // }
    }
  };

  return AnimatedComponent;
}

module.exports = createAnimatedComponent;
