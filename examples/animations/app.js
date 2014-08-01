/** @jsx React.DOM */
var React = require('react');
var Router = require('../../index');
var Routes = Router.Routes;
var Route = Router.Route;
var Link = Router.Link;
var Transition = require('react/lib/ReactCSSTransitionGroup');

var App = React.createClass({
  render: function() {
    return (
      <div>
        <ul>
          <li><Link to="image" service="kitten">Kitten</Link></li>
          <li><Link to="image" service="cage">Cage</Link></li>
        </ul>
        <Transition transitionName="example">
          {this.props.activeRouteHandler()}
        </Transition>
      </div>
    );
  }
});

var Image = React.createClass({
  render: function() {
    var src = "http://place"+this.props.params.service+".com/400/400";
    return (
      <div className="Image">
        <img src={src}/>
      </div>
    );
  }
});

var routes = (
  <Routes>
    <Route handler={App}>
      <Route name="image" path="/:service" handler={Image}/>
    </Route>
  </Routes>
);

React.renderComponent(routes, document.getElementById('example'));
