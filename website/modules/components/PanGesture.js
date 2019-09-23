// Thanks @iammerrick! <3 <3 <3
import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";

function getPointRelativeToElement(point, element) {
  const rect = element.getBoundingClientRect();
  return { x: point.x - rect.left, y: point.y - rect.top };
}

function getDistanceBetweenPoints(pointA, pointB) {
  return Math.max(Math.abs(pointA.x - pointB.x), Math.abs(pointA.y - pointB.y));
}

function pointFromTouch(touch) {
  return { x: touch.clientX, y: touch.clientY };
}

const THRESHOLD = 10;

export default class PanGesture extends Component {
  static propTypes = {
    when: PropTypes.bool,
    onPanStart: PropTypes.func,
    onPan: PropTypes.func,
    onPanEnd: PropTypes.func,
    children: PropTypes.node
  };

  static defaultProps = {
    when: true
  };

  startPoint = null;
  point = null;
  isRecognizing = false;

  componentDidMount() {
    this.el = findDOMNode(this);

    if (this.props.when) {
      this.listen();
    }
  }

  componentWillReceiveProps(next) {
    if (this.props.when !== next.when) {
      if (next.when) {
        this.listen();
      } else {
        this.unlisten();
      }
    }
  }

  componentWillUnmount() {
    this.unlisten();
  }

  listen() {
    this.el.addEventListener("touchstart", this.handleTouchStart, false);
    this.el.addEventListener("touchmove", this.handleTouchMove, false);
    this.el.addEventListener("touchend", this.handleTouchEnd, false);
  }

  unlisten() {
    this.el.removeEventListener("touchstart", this.handleTouchStart, false);
    this.el.removeEventListener("touchmove", this.handleTouchMove, false);
    this.el.removeEventListener("touchend", this.handleTouchEnd, false);
  }

  handleTouchStart = event => {
    if (event.touches.length !== 1) return null;

    this.startPoint = this.point = pointFromTouch(event.touches[0]);
  };

  handleTouchMove = event => {
    if (event.touches.length !== 1 || !this.startPoint) return null;

    this.point = getPointRelativeToElement(
      pointFromTouch(event.touches[0]),
      this.el
    );

    if (this.isRecognizing) {
      this.props.onPan({
        x: this.point.x,
        y: this.point.y,
        dx: this.point.x - this.startPoint.x,
        dy: this.point.y - this.startPoint.y,
        event
      });
    } else {
      if (getDistanceBetweenPoints(this.startPoint, this.point) >= THRESHOLD) {
        this.isRecognizing = true;
        this.props.onPanStart({
          x: this.point.x,
          y: this.point.y,
          dx: this.point.x - this.startPoint.x,
          dy: this.point.y - this.startPoint.y,
          event
        });
      }
    }
  };

  handleTouchEnd = event => {
    if (this.point) {
      this.props.onPanEnd({
        x: this.point.x,
        y: this.point.y,
        dx: this.point.x - this.startPoint.x,
        dy: this.point.y - this.startPoint.y,
        event
      });
    }
    this.point = null;
    this.startPoint = null;
    this.isRecognizing = false;
  };

  render() {
    return React.Children.only(this.props.children);
  }
}
