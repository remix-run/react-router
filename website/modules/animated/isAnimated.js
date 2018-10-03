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

var Animated = require("./Animated");

function isAnimated(obj) {
  return obj instanceof Animated;
}

module.exports = isAnimated;
