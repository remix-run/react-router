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
var AnimatedWithChildren = require("./AnimatedWithChildren");
var AnimatedTransform = require("./AnimatedTransform");
var FlattenStyle = require("./injectable/FlattenStyle");

class AnimatedStyle extends AnimatedWithChildren {
  _style: Object;

  constructor(style: any) {
    super();
    style = FlattenStyle.current(style) || {};
    if (style.transform && !(style.transform instanceof Animated)) {
      style = {
        ...style,
        transform: new AnimatedTransform(style.transform)
      };
    }
    this._style = style;
  }

  __getValue(): Object {
    var style = {};
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        style[key] = value.__getValue();
      } else {
        style[key] = value;
      }
    }
    return style;
  }

  __getAnimatedValue(): Object {
    var style = {};
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        style[key] = value.__getAnimatedValue();
      }
    }
    return style;
  }

  __attach(): void {
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        value.__addChild(this);
      }
    }
  }

  __detach(): void {
    for (var key in this._style) {
      var value = this._style[key];
      if (value instanceof Animated) {
        value.__removeChild(this);
      }
    }
  }
}

module.exports = AnimatedStyle;
