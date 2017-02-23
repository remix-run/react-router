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

var { View, Image, Text } = require('react-native');
var Animated = require('../');

// TODO(lmr): inject flattenStyle
// TODO(lmr): inject InteractionManager

module.exports = {
  ...Animated,
  View: Animated.createAnimatedComponent(View),
  Text: Animated.createAnimatedComponent(Text),
  Image: Animated.createAnimatedComponent(Image),
};
