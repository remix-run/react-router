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

var invariant = require('invariant')

var Animated = require('./Animated')
var AnimatedValue = require('./AnimatedValue')
var AnimatedValueXY = require('./AnimatedValueXY')
var AnimatedAddition = require('./AnimatedAddition')
var AnimatedMultiplication = require('./AnimatedMultiplication')
var AnimatedModulo = require('./AnimatedModulo')
var AnimatedTemplate = require('./AnimatedTemplate')
var AnimatedTracking = require('./AnimatedTracking')
var isAnimated = require('./isAnimated')

var Animation = require('./Animation')
var TimingAnimation = require('./TimingAnimation')
var DecayAnimation = require('./DecayAnimation')
var SpringAnimation = require('./SpringAnimation')

import type { InterpolationConfigType } from './Interpolation'
import type { AnimationConfig, EndResult, EndCallback } from './Animation'

type TimingAnimationConfig =  AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY;
  easing?: (value: number) => number;
  duration?: number;
  delay?: number;
};

type DecayAnimationConfig = AnimationConfig & {
  velocity: number | {x: number, y: number};
  deceleration?: number;
};

type SpringAnimationConfig = AnimationConfig & {
  toValue: number | AnimatedValue | {x: number, y: number} | AnimatedValueXY;
  overshootClamping?: bool;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  velocity?: number | {x: number, y: number};
  bounciness?: number;
  speed?: number;
  tension?: number;
  friction?: number;
};

type CompositeAnimation = {
  start: (callback?: ?EndCallback) => void;
  stop: () => void;
};

var maybeVectorAnim = function(
  value: AnimatedValue | AnimatedValueXY,
  config: Object,
  anim: (value: AnimatedValue, config: Object) => CompositeAnimation
): ?CompositeAnimation {
  if (value instanceof AnimatedValueXY) {
    var configX = {...config}
    var configY = {...config}
    for (var key in config) {
      var {x, y} = config[key]
      if (x !== undefined && y !== undefined) {
        configX[key] = x
        configY[key] = y
      }
    }
    var aX = anim((value: AnimatedValueXY).x, configX)
    var aY = anim((value: AnimatedValueXY).y, configY)
    // We use `stopTogether: false` here because otherwise tracking will break
    // because the second animation will get stopped before it can update.
    return parallel([aX, aY], {stopTogether: false})
  }
  return null
}

var spring = function(
  value: AnimatedValue | AnimatedValueXY,
  config: SpringAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, spring) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value
      var singleConfig: any = config
      singleValue.stopTracking()
      if (config.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          config.toValue,
          SpringAnimation,
          singleConfig,
          callback
        ))
      } else {
        singleValue.animate(new SpringAnimation(singleConfig), callback)
      }
    },

    stop: function(): void {
      value.stopAnimation()
    }
  }
}

var timing = function(
  value: AnimatedValue | AnimatedValueXY,
  config: TimingAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, timing) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value
      var singleConfig: any = config
      singleValue.stopTracking()
      if (config.toValue instanceof Animated) {
        singleValue.track(new AnimatedTracking(
          singleValue,
          config.toValue,
          TimingAnimation,
          singleConfig,
          callback
        ))
      } else {
        singleValue.animate(new TimingAnimation(singleConfig), callback)
      }
    },

    stop: function(): void {
      value.stopAnimation()
    }
  }
}

var decay = function(
  value: AnimatedValue | AnimatedValueXY,
  config: DecayAnimationConfig,
): CompositeAnimation {
  return maybeVectorAnim(value, config, decay) || {
    start: function(callback?: ?EndCallback): void {
      var singleValue: any = value
      var singleConfig: any = config
      singleValue.stopTracking()
      singleValue.animate(new DecayAnimation(singleConfig), callback)
    },

    stop: function(): void {
      value.stopAnimation()
    }
  }
}

var sequence = function(
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  var current = 0
  return {
    start: function(callback?: ?EndCallback) {
      var onComplete = function(result) {
        if (!result.finished) {
          callback && callback(result)
          return
        }

        current++

        if (current === animations.length) {
          callback && callback(result)
          return
        }

        animations[current].start(onComplete)
      }

      if (animations.length === 0) {
        callback && callback({finished: true})
      } else {
        animations[current].start(onComplete)
      }
    },

    stop: function() {
      if (current < animations.length) {
        animations[current].stop()
      }
    }
  }
}

type ParallelConfig = {
  stopTogether?: bool; // If one is stopped, stop all.  default: true
}
var parallel = function(
  animations: Array<CompositeAnimation>,
  config?: ?ParallelConfig,
): CompositeAnimation {
  var doneCount = 0
  // Make sure we only call stop() at most once for each animation
  var hasEnded = {}
  var stopTogether = !(config && config.stopTogether === false)

  var result = {
    start: function(callback?: ?EndCallback) {
      if (doneCount === animations.length) {
        callback && callback({finished: true})
        return
      }

      animations.forEach((animation, idx) => {
        var cb = function(endResult) {
          hasEnded[idx] = true
          doneCount++
          if (doneCount === animations.length) {
            doneCount = 0
            callback && callback(endResult)
            return
          }

          if (!endResult.finished && stopTogether) {
            result.stop()
          }
        }

        if (!animation) {
          cb({finished: true})
        } else {
          animation.start(cb)
        }
      })
    },

    stop: function(): void {
      animations.forEach((animation, idx) => {
        !hasEnded[idx] && animation.stop()
        hasEnded[idx] = true
      })
    }
  }

  return result
}

var delay = function(time: number): CompositeAnimation {
  // Would be nice to make a specialized implementation
  return timing(new AnimatedValue(0), {toValue: 0, delay: time, duration: 0})
}

var stagger = function(
  time: number,
  animations: Array<CompositeAnimation>,
): CompositeAnimation {
  return parallel(animations.map((animation, i) => {
    return sequence([
      delay(time * i),
      animation
    ])
  }))
}

type Mapping = {[key: string]: Mapping} | AnimatedValue;

type EventConfig = {listener?: ?Function};
var event = function(
  argMapping: Array<?Mapping>,
  config?: ?EventConfig,
): () => void {
  return function(...args): void {
    var traverse = function(recMapping, recEvt, key) {
      if (typeof recEvt === 'number') {
        invariant(
          recMapping instanceof AnimatedValue,
          'Bad mapping of type ' + typeof recMapping + ' for key ' + key +
            ', event value must map to AnimatedValue'
        )
        recMapping.setValue(recEvt)
        return
      }
      invariant(
        typeof recMapping === 'object',
        'Bad mapping of type ' + typeof recMapping + ' for key ' + key
      )
      invariant(
        typeof recEvt === 'object',
        'Bad event of type ' + typeof recEvt + ' for key ' + key
      )
      for (var key in recMapping) {
        traverse(recMapping[key], recEvt[key], key)
      }
    }
    argMapping.forEach((mapping, idx) => {
      traverse(mapping, args[idx], 'arg' + idx)
    })
    if (config && config.listener) {
      config.listener.apply(null, args)
    }
  }
}

/**
 * Animations are an important part of modern UX, and the `Animated`
 * library is designed to make them fluid, powerful, and easy to build and
 * maintain.
 *
 * The simplest workflow is to create an `Animated.Value`, hook it up to one or
 * more style attributes of an animated component, and then drive updates either
 * via animations, such as `Animated.timing`, or by hooking into gestures like
 * panning or scrolling via `Animated.event`.  `Animated.Value` can also bind to
 * props other than style, and can be interpolated as well.  Here is a basic
 * example of a container view that will fade in when it's mounted:
 *
 *```javascript
 *  class FadeInView extends React.Component {
 *    constructor(props) {
 *      super(props);
 *      this.state = {
 *        fadeAnim: new Animated.Value(0), // init opacity 0
 *      };
 *    }
 *    componentDidMount() {
 *      Animated.timing(          // Uses easing functions
 *        this.state.fadeAnim,    // The value to drive
 *        {toValue: 1},           // Configuration
 *      ).start();                // Don't forget start!
 *    }
 *    render() {
 *      return (
 *        <Animated.View          // Special animatable View
 *          style={{opacity: this.state.fadeAnim}}> // Binds
 *          {this.props.children}
 *        </Animated.View>
 *      );
 *    }
 *  }
 *```
 *
 * Note that only animatable components can be animated.  `View`, `Text`, and
 * `Image` are already provided, and you can create custom ones with
 * `createAnimatedComponent`.  These special components do the magic of binding
 * the animated values to the properties, and do targeted native updates to
 * avoid the cost of the react render and reconciliation process on every frame.
 * They also handle cleanup on unmount so they are safe by default.
 *
 * Animations are heavily configurable.  Custom and pre-defined easing
 * functions, delays, durations, decay factors, spring constants, and more can
 * all be tweaked depending on the type of animation.
 *
 * A single `Animated.Value` can drive any number of properties, and each
 * property can be run through an interpolation first.  An interpolation maps
 * input ranges to output ranges, typically using a linear interpolation but
 * also supports easing functions.  By default, it will extrapolate the curve
 * beyond the ranges given, but you can also have it clamp the output value.
 *
 * For example, you may want to think about your `Animated.Value` as going from
 * 0 to 1, but animate the position from 150px to 0px and the opacity from 0 to
 * 1. This can easily be done by modifying `style` in the example above like so:
 *
 *```javascript
 *  style={{
 *    opacity: this.state.fadeAnim, // Binds directly
 *    transform: [{
 *      translateY: this.state.fadeAnim.interpolate({
 *        inputRange: [0, 1],
 *        outputRange: [150, 0]  // 0 : 150, 0.5 : 75, 1 : 0
 *      }),
 *    }],
 *  }}>
 *```
 *
 * Animations can also be combined in complex ways using composition functions
 * such as `sequence` and `parallel`, and can also be chained together simply
 * by setting the `toValue` of one animation to be another `Animated.Value`.
 *
 * `Animated.ValueXY` is handy for 2D animations, like panning, and there are
 * other helpful additions like `setOffset` and `getLayout` to aid with typical
 * interaction patterns, like drag-and-drop.
 *
 * You can see more example usage in `AnimationExample.js`, the Gratuitous
 * Animation App, and [Animations documentation guide](docs/animations.html).
 *
 * Note that `Animated` is designed to be fully serializable so that animations
 * can be run in a high performance way, independent of the normal JavaScript
 * event loop. This does influence the API, so keep that in mind when it seems a
 * little trickier to do something compared to a fully synchronous system.
 * Checkout `Animated.Value.addListener` as a way to work around some of these
 * limitations, but use it sparingly since it might have performance
 * implications in the future.
 */
module.exports = {
  /**
   * Standard value class for driving animations.  Typically initialized with
   * `new Animated.Value(0);`
   */
  Value: AnimatedValue,
  /**
   * 2D value class for driving 2D animations, such as pan gestures.
   */
  ValueXY: AnimatedValueXY,

  /**
   * Animates a value from an initial velocity to zero based on a decay
   * coefficient.
   */
  decay,
  /**
   * Animates a value along a timed easing curve.  The `Easing` module has tons
   * of pre-defined curves, or you can use your own function.
   */
  timing,
  /**
   * Spring animation based on Rebound and Origami.  Tracks velocity state to
   * create fluid motions as the `toValue` updates, and can be chained together.
   */
  spring,

  /**
   * Creates a new Animated value composed from two Animated values added
   * together.
   */
  add: function add(a: Animated, b: Animated): AnimatedAddition {
    return new AnimatedAddition(a, b)
  },
  /**
   * Creates a new Animated value composed from two Animated values multiplied
   * together.
   */
  multiply: function multiply(a: Animated, b: Animated): AnimatedMultiplication {
    return new AnimatedMultiplication(a, b)
  },

  /**
   * Creates a new Animated value that is the (non-negative) modulo of the
   * provided Animated value
   */
  modulo: function modulo(a: Animated, modulus: number): AnimatedModulo {
    return new AnimatedModulo(a, modulus)
  },

  /**
   * Creates a new Animated value that is the specified string, with each
   * substitution expression being separately animated and interpolated.
   */
  template: function template(strings, ...values) {
    return new AnimatedTemplate(strings, values)
  },

  /**
   * Starts an animation after the given delay.
   */
  delay,
  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next.  If the current running animation is stopped, no
   * following animations will be started.
   */
  sequence,
  /**
   * Starts an array of animations all at the same time.  By default, if one
   * of the animations is stopped, they will all be stopped.  You can override
   * this with the `stopTogether` flag.
   */
  parallel,
  /**
   * Array of animations may run in parallel (overlap), but are started in
   * sequence with successive delays.  Nice for doing trailing effects.
   */
  stagger,

  /**
   *  Takes an array of mappings and extracts values from each arg accordingly,
   *  then calls `setValue` on the mapped outputs.  e.g.
   *
   *```javascript
   *  onScroll={Animated.event(
   *    [{nativeEvent: {contentOffset: {x: this._scrollX}}}]
   *    {listener},          // Optional async listener
   *  )
   *  ...
   *  onPanResponderMove: Animated.event([
   *    null,                // raw event arg ignored
   *    {dx: this._panX},    // gestureState arg
   *  ]),
   *```
   */
  event,

  /**
   * Existential test to figure out if an object is an instance of the Animated
   * class or not.
   */
  isAnimated,

  /**
   * Make any React component Animatable.  Used to create `Animated.View`, etc.
   */
  createAnimatedComponent: require('./createAnimatedComponent'),

  inject: {
    ApplyAnimatedValues: require('./injectable/ApplyAnimatedValues').inject,
    InteractionManager: require('./injectable/InteractionManager').inject,
    FlattenStyle: require('./injectable/FlattenStyle').inject,
    RequestAnimationFrame: require('./injectable/RequestAnimationFrame').inject,
    CancelAnimationFrame: require('./injectable/CancelAnimationFrame').inject
  },

  __PropsOnlyForTests: require('./AnimatedProps')
}
