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
var AnimatedValue = require("./AnimatedValue");
var Easing = require("./Easing");
var RequestAnimationFrame = require("./injectable/RequestAnimationFrame");
var CancelAnimationFrame = require("./injectable/CancelAnimationFrame");

import type { AnimationConfig, EndCallback } from "./Animation";

var easeInOut = Easing.inOut(Easing.ease);

type TimingAnimationConfigSingle = AnimationConfig & {
  toValue: number | AnimatedValue,
  easing?: (value: number) => number,
  duration?: number,
  delay?: number
};

class TimingAnimation extends Animation {
  _startTime: number;
  _fromValue: number;
  _toValue: any;
  _duration: number;
  _delay: number;
  _easing: (value: number) => number;
  _onUpdate: (value: number) => void;
  _animationFrame: any;
  _timeout: any;

  constructor(config: TimingAnimationConfigSingle) {
    super();
    this._toValue = config.toValue;
    this._easing = config.easing !== undefined ? config.easing : easeInOut;
    this._duration = config.duration !== undefined ? config.duration : 500;
    this._delay = config.delay !== undefined ? config.delay : 0;
    this.__isInteraction =
      config.isInteraction !== undefined ? config.isInteraction : true;
  }

  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback
  ): void {
    this.__active = true;
    this._fromValue = fromValue;
    this._onUpdate = onUpdate;
    this.__onEnd = onEnd;

    var start = () => {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
        this.__debouncedOnEnd({ finished: true });
      } else {
        this._startTime = Date.now();
        this._animationFrame = RequestAnimationFrame.current(
          this.onUpdate.bind(this)
        );
      }
    };
    if (this._delay) {
      this._timeout = setTimeout(start, this._delay);
    } else {
      start();
    }
  }

  onUpdate(): void {
    var now = Date.now();
    if (now >= this._startTime + this._duration) {
      if (this._duration === 0) {
        this._onUpdate(this._toValue);
      } else {
        this._onUpdate(
          this._fromValue + this._easing(1) * (this._toValue - this._fromValue)
        );
      }
      this.__debouncedOnEnd({ finished: true });
      return;
    }

    this._onUpdate(
      this._fromValue +
        this._easing((now - this._startTime) / this._duration) *
          (this._toValue - this._fromValue)
    );
    if (this.__active) {
      this._animationFrame = RequestAnimationFrame.current(
        this.onUpdate.bind(this)
      );
    }
  }

  stop(): void {
    this.__active = false;
    clearTimeout(this._timeout);
    CancelAnimationFrame.current(this._animationFrame);
    this.__debouncedOnEnd({ finished: false });
  }
}

module.exports = TimingAnimation;
