var React = require('react');
var Link = require('./components/Link');
var CatchAllRoute = require('./components/CatchAllRoute');
var DefaultRoute = require('./components/DefaultRoute');
var Redirect = require('./components/Redirect');
var Route = require('./components/Route');

class Parent extends React.Component {
  render() {
    return (
      <div>
        <h1>Parent</h1>
        {this.props.children}
      </div>
    );
  }
}

class Header extends React.Component {
  render() {
    return <div>Header</div>;
  }
}

class Sidebar extends React.Component {
  render() {
    return <div>Sidebar</div>;
  }
}

module.exports = {
  // fixtures
  Parent,
  Header,
  Sidebar,

  // components
  Link,

  // config components
  CatchAllRoute,
  DefaultRoute,
  Redirect,
  Route
};

// exports.Async = React.createClass({
//   statics: {
//     delay: 10,
// 
//     willTransitionTo: function (transition, params, query, callback) {
//       setTimeout(callback, exports.Async.delay);
//     }
//   },
// 
//   render: function () {
//     return <div className="Async">Async</div>;
//   }
// });
// 
// exports.RedirectToFoo = React.createClass({
//   statics: {
//     willTransitionTo: function (transition) {
//       transition.redirect('/foo');
//     }
//   },
// 
//   render: function () {
//     return null;
//   }
// });
// 
// exports.RedirectToFooAsync = React.createClass({
//   statics: {
//     delay: 10,
// 
//     willTransitionTo: function (transition, params, query, callback) {
//       setTimeout(function () {
//         transition.redirect('/foo');
//         callback();
//       }, exports.RedirectToFooAsync.delay);
//     }
//   },
// 
//   render: function () {
//     return null;
//   }
// });
// 
// 
// exports.Abort = React.createClass({
//   statics: {
//     willTransitionTo: function (transition) {
//       transition.abort();
//     }
//   },
// 
//   render: function () {
//     return null;
//   }
// });
// 
// exports.AbortAsync = React.createClass({
//   statics: {
//     delay: 10,
// 
//     willTransitionTo: function (transition, params, query, callback) {
//       setTimeout(function () {
//         transition.abort();
//         callback();
//       }, exports.AbortAsync.delay);
//     }
//   },
// 
//   render: function () {
//     return null;
//   }
// });
// 
// exports.EchoFooProp = React.createClass({
//   render: function () {
//     return <div>{this.props.foo}</div>;
//   }
// });
// 
// exports.EchoBarParam = React.createClass({
//   contextTypes: {
//     router: PropTypes.router.isRequired
//   },
//   render: function () {
//     return <div className="EchoBarParam">{this.context.router.getCurrentParams().bar}</div>;
//   }
// });
