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

export type EndResult = {finished: bool};
export type EndCallback = (result: EndResult) => void;
export type AnimationConfig = {
  isInteraction?: bool;
};

// Important note: start() and stop() will only be called at most once.
// Once an animation has been stopped or finished its course, it will
// not be reused.
class Animation {
  __active: bool;
  __isInteraction: bool;
  __onEnd: ?EndCallback;
  start(
    fromValue: number,
    onUpdate: (value: number) => void,
    onEnd: ?EndCallback,
    previousAnimation: ?Animation,
  ): void {}
  stop(): void {}
  // Helper function for subclasses to make sure onEnd is only called once.
  __debouncedOnEnd(result: EndResult) {
    var onEnd = this.__onEnd
    this.__onEnd = null
    onEnd && onEnd(result)
  }
}

module.exports = Animation
