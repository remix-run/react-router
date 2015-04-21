"use strict";

var React = require("react");
var RouteHandler = require("./components/RouteHandler");
var PropTypes = require("./PropTypes");

exports.Nested = React.createClass({
  displayName: "Nested",

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h1",
        { className: "Nested" },
        "Nested"
      ),
      React.createElement(RouteHandler, null)
    );
  }
});

exports.Foo = React.createClass({
  displayName: "Foo",

  render: function render() {
    return React.createElement(
      "div",
      { className: "Foo" },
      "Foo"
    );
  }
});

exports.Bar = React.createClass({
  displayName: "Bar",

  render: function render() {
    return React.createElement(
      "div",
      { className: "Bar" },
      "Bar"
    );
  }
});

exports.Baz = React.createClass({
  displayName: "Baz",

  render: function render() {
    return React.createElement(
      "div",
      { className: "Baz" },
      "Baz"
    );
  }
});

exports.Async = React.createClass({
  displayName: "Async",

  statics: {
    delay: 10,

    willTransitionTo: function willTransitionTo(transition, params, query, callback) {
      setTimeout(callback, exports.Async.delay);
    }
  },

  render: function render() {
    return React.createElement(
      "div",
      { className: "Async" },
      "Async"
    );
  }
});

exports.RedirectToFoo = React.createClass({
  displayName: "RedirectToFoo",

  statics: {
    willTransitionTo: function willTransitionTo(transition) {
      transition.redirect("/foo");
    }
  },

  render: function render() {
    return null;
  }
});

exports.RedirectToFooAsync = React.createClass({
  displayName: "RedirectToFooAsync",

  statics: {
    delay: 10,

    willTransitionTo: function willTransitionTo(transition, params, query, callback) {
      setTimeout(function () {
        transition.redirect("/foo");
        callback();
      }, exports.RedirectToFooAsync.delay);
    }
  },

  render: function render() {
    return null;
  }
});

exports.Abort = React.createClass({
  displayName: "Abort",

  statics: {
    willTransitionTo: function willTransitionTo(transition) {
      transition.abort();
    }
  },

  render: function render() {
    return null;
  }
});

exports.AbortAsync = React.createClass({
  displayName: "AbortAsync",

  statics: {
    delay: 10,

    willTransitionTo: function willTransitionTo(transition, params, query, callback) {
      setTimeout(function () {
        transition.abort();
        callback();
      }, exports.AbortAsync.delay);
    }
  },

  render: function render() {
    return null;
  }
});

exports.EchoFooProp = React.createClass({
  displayName: "EchoFooProp",

  render: function render() {
    return React.createElement(
      "div",
      null,
      this.props.foo
    );
  }
});

exports.EchoBarParam = React.createClass({
  displayName: "EchoBarParam",

  contextTypes: {
    router: PropTypes.router.isRequired
  },
  render: function render() {
    return React.createElement(
      "div",
      { className: "EchoBarParam" },
      this.context.router.getCurrentParams().bar
    );
  }
});