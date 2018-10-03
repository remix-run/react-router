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

var ApplyAnimatedValues = {
  current: function ApplyAnimatedValues(instance, props) {
    if (instance.setNativeProps) {
      instance.setNativeProps(props);
    } else {
      return false;
    }
  },
  transformStyles: function transformStyles(style) {
    return style;
  },
  inject(apply, transform) {
    ApplyAnimatedValues.current = apply;
    ApplyAnimatedValues.transformStyles = transform;
  }
};

module.exports = ApplyAnimatedValues;
