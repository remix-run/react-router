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

var Animation = require("./Animation");
var RequestAnimationFrame = require("./injectable/RequestAnimationFrame");
var CancelAnimationFrame = require("./injectable/CancelAnimationFrame");

import type { AnimationConfig, EndCallback } from "./Animation";

type DecayAnimationConfigSingle = AnimationConfig & {
  velocity: number,
  deceleration?: number
};

class DecayAnimation extends Animation {
  _startTime: number;
  _lastValue: number;
  _fromValue: number;
  _deceleration: number;
  _velocity: number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;

  constructor(config: DecayAnimationConfigSingle) {
    super();
    this._deceleration =
      config.deceleration !== undefined ? config.deceleration : 0.998;
    this._velocity = config.velocity;
    this.__isInteraction =
      config.isInteraction !== undefined ? config.isInteraction : true;
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback
  ): void {
    this.__active = true;
    this._lastValue = fromValue;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;
    this._startTime = Date.now();
    this._animationFrame = RequestAnimationFrame.current(
      this.onUpdate.bind(this)
    );
  }

  onUpdate(): void {
    var now = Date.now();

    var value =
      this._fromValue +
      this._velocity /
        (1 - this._deceleration) *
        (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));

    this._onUpdate(value);

    if (Math.abs(this._lastValue - value) < 0.1) {
      this.__debouncedOnEnd({ finished: true });
      return;
    }

    this._lastValue = value;
    if (this.__active) {
      this._animationFrame = RequestAnimationFrame.current(
        this.onUpdate.bind(this)
      );
    }
  }

  stop(): void {
    this.__active = false;
    CancelAnimationFrame.current(this._animationFrame);
    this.__debouncedOnEnd({ finished: false });
  }
}

module.exports = DecayAnimation;
