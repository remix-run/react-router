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

var CancelAnimationFrame = {
  current: id => global.cancelAnimationFrame(id),
  inject(injected) {
    CancelAnimationFrame.current = injected;
  }
};

module.exports = CancelAnimationFrame;
