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
var invariant = require("invariant");
var Interpolation = require("./Interpolation");
var guid = require("./guid");

import type { ValueListenerCallback } from "./AnimatedValue";

class AnimatedInterpolation extends AnimatedWithChildren {
  _parent: Animated;
  _interpolation: (input: number) => number | string;
  _listeners: { [key: number]: ValueListenerCallback };
  _parentListener: number;

  constructor(
    parent: Animated,
    interpolation: (input: number) => number | string
  ) {
    super();
    this._parent = parent;
    this._interpolation = interpolation;
    this._listeners = {};
  }

  __getValue(): number | string {
    var parentValue: number = this._parent.__getValue();
    invariant(
      typeof parentValue === "number",
      "Cannot interpolate an input which is not a number."
    );
    return this._interpolation(parentValue);
  }

  addListener(callback: ValueListenerCallback): string {
    if (!this._parentListener) {
      this._parentListener = this._parent.addListener(() => {
        for (var key in this._listeners) {
          this._listeners[key]({ value: this.__getValue() });
        }
      });
    }
    var id = guid();
    this._listeners[id] = callback;
    return id;
  }

  removeListener(id: string): void {
    delete this._listeners[id];
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, Interpolation.create(config));
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
    this._parentListener = this._parent.removeListener(this._parentListener);
  }
}

module.exports = AnimatedInterpolation;
