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
'use strict';

var Animated = require('./Animated');
var AnimatedWithChildren = require('./AnimatedWithChildren');

class AnimatedTemplate extends AnimatedWithChildren {
  _strings: Array<string>;
  _values: Array;

  constructor(strings, values) {
    super();
    this._strings = strings;
    this._values = values;
  }

  __transformValue(value): any {
    if (value instanceof Animated) {
      return value.__getValue();
    } else {
      return value;
    }
  }

  __getValue(): String {
    var value = this._strings[0];
    for (var i = 0; i < this._values.length; ++i) {
      value += this.__transformValue(this._values[i]) + this._strings[1 + i];
    }
    return value;
  }

  __attach(): void {
    for (var i = 0; i < this._values.length; ++i) {
      if (this._values[i] instanceof Animated) {
        this._values[i].__addChild(this);
      }
    }
  }

  __detach(): void {
    for (var i = 0; i < this._values.length; ++i) {
      if (this._values[i] instanceof Animated) {
        this._values[i].__removeChild(this);
      }
    }
  }
}

module.exports = AnimatedTemplate;
