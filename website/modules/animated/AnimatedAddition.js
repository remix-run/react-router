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
'use strict'

var AnimatedWithChildren = require('./AnimatedWithChildren')
var Animated = require('./Animated')
var AnimatedValue = require('./AnimatedValue')
var Interpolation = require('./Interpolation')
var AnimatedInterpolation = require('./AnimatedInterpolation')

import type { InterpolationConfigType } from './Interpolation'

class AnimatedAddition extends AnimatedWithChildren {
  _a: Animated;
  _b: Animated;
  _aListener: number;
  _bListener: number;
  _listeners: {[key: number]: ValueListenerCallback};

  constructor(a: Animated | number, b: Animated | number) {
    super()
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b
    this._listeners = {}
  }

  __getValue(): number {
    return this._a.__getValue() + this._b.__getValue()
  }

  addListener(callback: ValueListenerCallback): string {
    if (!this._aListener && this._a.addListener) {
      this._aListener = this._a.addListener(() => {
        for (var key in this._listeners) {
          this._listeners[key]({value: this.__getValue()})
        }
      })
    }
    if (!this._bListener && this._b.addListener) {
      this._bListener = this._b.addListener(() => {
        for (var key in this._listeners) {
          this._listeners[key]({value: this.__getValue()})
        }
      })
    }
    var id = guid()
    this._listeners[id] = callback
    return id
  }

  removeListener(id: string): void {
    delete this._listeners[id]
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, Interpolation.create(config))
  }

  __attach(): void {
    this._a.__addChild(this)
    this._b.__addChild(this)
  }

  __detach(): void {
    this._a.__removeChild(this)
    this._b.__removeChild(this)
  }
}

module.exports = AnimatedAddition
