/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
"use strict";

var Animated = require("./Animated");
var AnimatedStyle = require("./AnimatedStyle");

class AnimatedProps extends Animated {
  _props: Object;
  _callback: () => void;

  constructor(props: Object, callback: () => void) {
    super();
    if (props.style) {
      props = {
        ...props,
        style: new AnimatedStyle(props.style)
      };
    }
    this._props = props;
    this._callback = callback;
    this.__attach();
  }

  __getValue(): Object {
    var props = {};
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        props[key] = value.__getValue();
      } else {
        props[key] = value;
      }
    }
    return props;
  }

  __getAnimatedValue(): Object {
    var props = {};
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        props[key] = value.__getAnimatedValue();
      }
    }
    return props;
  }

  __attach(): void {
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (var key in this._props) {
      var value = this._props[key];
      if (value instanceof Animated) {
        value.__removeChild(this);
      }
    }
  }

  update(): void {
    this._callback();
  }
}

module.exports = AnimatedProps;
