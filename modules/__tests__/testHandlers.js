var React = require('react');
var ActiveRouteHandler = require('../components/ActiveRouteHandler');
var ActiveState = require('../mixins/ActiveState');

exports.Nested = React.createClass({
  render: function () {
    return (
      <div>
        <h1 className="Nested">Nested</h1>
        <ActiveRouteHandler />
      </div>
    );
  }
});

exports.Foo = React.createClass({
  render: function () {
    return <div className="Foo">Foo</div>
  }
});

exports.Bar = React.createClass({
  render: function () {
    return <div className="Bar">Bar</div>
  }
});

exports.RedirectToFoo = React.createClass({
  statics: {
    willTransitionTo: function(transition) {
      transition.redirect('/foo');
    }
  },

  render: function() {
    return null;
  }
});

exports.EchoFooProp = React.createClass({
  render: function () {
    return <div>{this.props.foo}</div>;
  }
});

exports.EchoBarParam = React.createClass({
  mixins: [ActiveState],
  render: function () {
    return <div className="EchoBarParam">{this.getActiveParams().bar}</div>
  }
});

