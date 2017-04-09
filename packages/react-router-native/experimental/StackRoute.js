// IMPORTANT NOTE!
//
// This is "throw it at the wall until it sticks" code.
// Don't take it too seriously
// Any help cleaning it up would be appreciated.
// <3 <3 <3 - Ryan

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Text,
  View,
  TouchableHighlight,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native'

import Route from 'react-router/Route'
import Redirect from 'react-router/Redirect'
import Link from '../Link'

const { any, node } = PropTypes

class StackContainer extends Component {
  static contextTypes = {
    stack: any
  }

  static childContextTypes = {
    stack: any
  }

  initialLocation = {
    ...this.props.location,
    pathname: this.props.match.url
  }

  getChildContext() {
    return {
      stack: {
        ...this.context.stack,
        parentLocation: this.initialLocation
      }
    }
  }

  componentWillMount() {
    this.pushToStack('down')
  }

  componentDidUpdate(prevProps) {
    const becameActive = (
      this.props.match.isExact === true &&
      prevProps.match.isExact === false
    )

    if (becameActive) {
      this.pushToStack('up')
    }
  }

  pushToStack(direction) {
    const { renderTitle, renderContent, renderChild, ...rest } = this.props
    const { match } = rest
    if (match && match.isExact) {
      this.context.stack.push({
        title: renderTitle(rest),
        content: renderContent(rest),
        parentLocation: this.context.stack.parentLocation,
        direction
      })
    }
  }

  render() {
    const { renderTitle, renderContent, renderChild, ...rest } = this.props
    const { match } = rest
    return match.isExact ? null : renderChild ? renderChild(rest) : null
  }
}

const ANIMATION_DURATION = 300
const CANCEL_PAN_MOVE_THRESHOLD = 0.5
const CANCEL_PAN_VX_THRESHOLD = 0.5
const PAN_START_MARGIN = 30
const PARENT_TRAVEL_DISTANCE = 100
const PARENT_FINAL_OPACITY = 0.25
const CARD_SHADOW_RADIUS = 10

class AnimatedStack extends React.Component {
  static propTypes = {
    title: any,
    content: any,
    backButton: any,
    parentLocation: any,
    location: any,
    onPanBackGrant: any,
    onCancelPan: any
  }

  state = {
    previousProps: null,
    panning: false,
    cancelingPan: false
  }

  animation = new Animated.Value(0)

  panResponder = PanResponder.create({

    onMoveShouldSetPanResponderCapture: (e, g) => {
      return (
        this.props.parentLocation &&
        e.nativeEvent.locationX <= PAN_START_MARGIN &&
        g.dx > 0
      )
    },

    onPanResponderGrant: (e, g) => {
      this.setState({
        startPan: true,
        panStartLeft: g.moveX
      }, () => {
        this.props.onPanBackGrant()
      })
    },

    onPanResponderMove: Animated.event([ null, { moveX: this.animation } ]),

    onPanResponderRelease: (e, g) => {
      const { panStartLeft } = this.state
      const { width } = Dimensions.get('window')
      const releaseRatio = g.moveX/width
      const isCancel = g.vx < CANCEL_PAN_VX_THRESHOLD && releaseRatio < CANCEL_PAN_MOVE_THRESHOLD
      if (isCancel) {
        this.animation.setValue(g.moveX - panStartLeft)
        this.setState({
          panning: false,
          cancelingPan: true
        }, () => {
          Animated.timing(this.animation, {
            toValue: 0,
            duration: releaseRatio * ANIMATION_DURATION + 2000
          }).start(({ finished }) => {
            this.props.onCancelPan()
          })
        })
      } else {
        this.animation.setValue(g.moveX - panStartLeft)
        this.setState({ panning: false }, () => {
          Animated.timing(this.animation, {
            toValue: width,
            duration: (1-releaseRatio) * ANIMATION_DURATION + 2000
          }).start(({ finished }) => {
            this.setState({
              previousProps: null
            })
          })
        })
      }
    }
  })

  componentWillReceiveProps(nextProps) {
    if (nextProps.location !== this.props.location) {
      if (this.state.cancelingPan) {
        // location comes in after the animation is done,
        // so we remove previousProps after the router transition
        this.setState({
          cancelingPan: false,
          previousProps: null
        })
      } else if (this.state.startPan) {
        // don't do "timing" animation when we start to pan, let
        // the user slide it around
        this.setState({
          startPan: false,
          panning: true,
          previousProps: this.props
        })
      } else {
        // normal case, new location shows up, so we animate
        const { width } = Dimensions.get('window')
        this.setState({
          previousProps: this.props
        }, () => {
          this.animation.setValue(0)
          Animated.timing(this.animation, {
            toValue: width,
            duration: ANIMATION_DURATION
          }).start(({ finished }) => {
            this.setState({ previousProps: null })
          })
        })
      }
    }
  }

  render() {
    const { width, height } = Dimensions.get('window')
    const { direction } = this.props
    const { previousProps, panDx, panning, panStartLeft } = this.state
    const animating = !!previousProps
    const bothProps = [ this.props ]
    if (animating)
      bothProps.push(previousProps)

    return (
      <View
        pointerEvents={animating ? 'none' : 'auto'}
        style={{ flex: 1  }}
        {...this.panResponder.panHandlers}
      >
        <View style={{ zIndex: 1, backgroundColor: '#f0f0f0', borderBottomColor: '#ccc', borderBottomWidth: 1, height: 40, alignItems: 'center' }}>
          {bothProps.map((props, index, arr) => {
            const isParent = index === 0
            const transitioning = arr.length > 1
            return (
              <Animated.View
                key={props.location.pathname}
                style={{
                  opacity: (
                    !transitioning ? (
                      1
                    ) : isParent ? (
                      this.animation.interpolate({
                        inputRange: [ 0, width ],
                        outputRange: [ 0, 1 ]
                      })
                    ) : (
                      this.animation.interpolate({
                        inputRange: [ 0, width ],
                        outputRange: [ 1, 0 ]
                      })
                    )
                  ),
                  flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0
                }}
              >
                <View style={{ width: 30 }}>
                  {props.parentLocation ? props.backButton : <Text>&nbsp;</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  {props.title}
                </View>
                <View style={{ width: 30 }}/>
              </Animated.View>
            )
          })}
        </View>
        <View style={{ flex: 1, backgroundColor: '#ccc' }}>
          {bothProps.map((props, index, arr) => {
            const isParent = index === 0
            const transitioning = arr.length > 1
            return (
              <Animated.View key={props.location.pathname} style={{
                transform: [{ translateX: !transitioning ? (
                  0
                ) : panning ? (
                  isParent ? (
                    this.animation.interpolate({
                      inputRange: [ 0, width ],
                      outputRange: [
                        -PARENT_TRAVEL_DISTANCE - panStartLeft,
                        -panStartLeft
                      ]
                    })
                  ) : (
                    this.animation.interpolate({
                      inputRange: [ 0, width ],
                      outputRange: [
                        -panStartLeft,
                        width-panStartLeft
                      ]
                    })
                  )
                ) : (
                  this.animation.interpolate({
                    inputRange: [ 0, width ],
                    outputRange: (
                      isParent ? (
                        direction === 'down' ? (
                          [ width + CARD_SHADOW_RADIUS, 0 ]
                        ) : (
                          [ -PARENT_TRAVEL_DISTANCE, 0 ]
                        )
                      ) : (
                        direction === 'down' ? (
                          [ 0, -PARENT_TRAVEL_DISTANCE ]
                        ) : (
                          [ 0, width + CARD_SHADOW_RADIUS ]
                        )
                      )
                    )
                  })
                ) }],
                zIndex: !transitioning ? 1 : (
                  isParent ? (
                    direction === 'down' ? 1 : 0
                  ) : (
                    direction === 'down' ? 0 : 1
                  )
                ),
                position: 'absolute', width, height, top: 0,
                shadowColor: "#000000",
                shadowOpacity: 0.25,
                shadowRadius: CARD_SHADOW_RADIUS,
                opacity: panning ? (
                  !isParent ? 1 : (
                    this.animation.interpolate({
                      inputRange: [ 0, width ],
                      outputRange: [ PARENT_FINAL_OPACITY, 1 ]
                    })
                  )
                ) : (
                  !transitioning ? 1 : isParent && 'direction' === 'down' ? 1 : (
                    this.animation.interpolate({
                      inputRange: [ 0, width ],
                      outputRange: (
                        index === 1 && direction === 'down' ? (
                          [ 1, PARENT_FINAL_OPACITY ]
                        ) : isParent && direction === 'up' ? (
                          [ PARENT_FINAL_OPACITY, 1 ]
                        ) : index === 1 && direction === 'up' ? (
                          [ 1, 1 ]
                        ) : [1, 1]
                      )
                    })
                  )
                )
              }}>
                {props.content}
              </Animated.View>
          )})}
        </View>
      </View>
    )
  }
}

const rootStoredLocations = {}

class StackRootContainer extends Component {
  static childContextTypes = {
    stack: any,
  }

  static contextTypes = {
    router: PropTypes.object
  }

  static propTypes = {
    children: PropTypes.node,
    location: PropTypes.object,
    path: PropTypes.string
  }

  state = {
    title: null,
    content: null,
    backLocation: null,
    backButton: null,
    direction: null
  }

  getChildContext() {
    return {
      stack: {
        push: ({ direction, title, content, parentLocation }) => {
          this.setState({
            direction,
            title,
            content,
            parentLocation,
            backButton: parentLocation ? (
              <Link replace={true} to={parentLocation}>
                <Text style={{ padding: 10 }}>&lt;</Text>
              </Link>
            ) : null
          })
        }
      }
    }
  }

  componentWillUnmount() {
    rootStoredLocations[this.props.path] = this.props.location
  }

  handlePanBack = () => {
    if (this.state.parentLocation) {
      this.panCancelLocation = this.props.location
      this.context.router.replace(this.state.parentLocation)
    }
  }

  handlePanCancel = () => {
    this.context.router.replace(this.panCancelLocation)
  }

  render() {
    const { title, content, backButton, parentLocation, direction } = this.state
    const { children, location } = this.props

    return (
      <View style={{ flex: 1 }}>
        <AnimatedStack
          title={title}
          content={content}
          backButton={backButton}
          parentLocation={parentLocation}
          direction={direction}
          location={location}
          onPanBackGrant={this.handlePanBack}
          onCancelPan={this.handlePanCancel}
        />
        {children}
      </View>
    )
  }
}

class RedirectStack extends Component {
  componentWillMount() {
    delete rootStoredLocations[this.props.path]
  }

  render() {
    return <Redirect to={this.props.to}/>
  }
}

class StackRoute extends Component {
  static propTypes = {
    path: any,
    isRoot: any,
    renderTitle: any,
    renderContent: any,
    renderChild: any
  }

  render() {
    const { isRoot, path, ...rest } = this.props
    return (
      <Route path={path} render={(props) => (
        isRoot ? (
          rootStoredLocations[path] ? (
            <RedirectStack path={path} to={rootStoredLocations[path]}/>
          ) : (
            <StackRootContainer path={path} location={props.location}>
              <StackContainer {...rest} {...props}/>
            </StackRootContainer>
          )
        ) : (
          <StackContainer {...rest} {...props}/>
        )
      )}/>
    )
  }
}

export default StackRoute
