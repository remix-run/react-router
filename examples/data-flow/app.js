/** @jsx React.DOM */
var React = require('react');
var Router = require('../../modules/main');
var Route = Router.Route;
var Routes = Router.Routes;
var Link = Router.Link;

var App = React.createClass({
  getInitialState: function() {
    return {
      tacos: [
        { name: 'duck confit' },
        { name: 'carne asada' },
        { name: 'shrimp' }
      ]
    };
  },

  addTaco: function() {
    var name = prompt('taco name?');
    this.setState({
      tacos: this.state.tacos.concat({name: name})
    });
  },

  handleRemoveTaco: function(removedTaco) {
    var tacos = this.state.tacos.filter(function(taco) {
      return taco.name != removedTaco;
    });
    this.setState({tacos: tacos});
    Router.transitionTo('/');
  },

  render: function() {
    var links = this.state.tacos.map(function(taco) {
      return <li><Link to="taco" name={taco.name}>{taco.name}</Link></li>
    });
    return (
      <div className="App">
        <button onClick={this.addTaco}>Add Taco</button>
        <ul className="Master">
          {links}
        </ul>
        <div className="Detail">
          {this.props.activeRouteHandler({onRemoveTaco: this.handleRemoveTaco})}
        </div>
      </div>
    );
  }
});

var Taco = React.createClass({
  remove: function() {
    this.props.onRemoveTaco(this.props.params.name);
  },

  render: function() {
    return (
      <div className="Taco">
        <h1>{this.props.params.name}</h1>
        <button onClick={this.remove}>remove</button>
      </div>
    );
  }
});

var routes = (
  <Routes>
    <Route handler={App}>
      <Route name="taco" path="taco/:name" handler={Taco}/>
    </Route>
  </Routes>
);

React.renderComponent(routes, document.getElementById('example'));
