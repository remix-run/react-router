/** @jsx React.DOM */
var React = require('react');
var Router = require('../../modules/main');
var Route = Router.Route;
var Link = Router.Link;

// Taco store!

var _tacos = [
  { name: 'duck confit' },
  { name: 'carne asada' },
  { name: 'shrimp' }
];

var tacoStore = {
  getAll: function () {
    return _tacos;
  },
  addTaco: function (taco) {
    _tacos.push(taco);
    this.onChange();
  },
  onChange: function () {}
};

// Components

var App = React.createClass({
  getInitialState: function() {
    return {
      tacos: tacoStore.getAll()
    };
  },

  addTaco: function() {
    var name = prompt('taco name?');
    tacoStore.addTaco({ name: name });
  },

  componentWillMount: function () {
    tacoStore.onChange = this.updateTacos;
  },

  updateTacos: function () {
    this.setState({ tacos: tacoStore.getAll() });
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
          {this.props.activeRoute()}
        </div>
      </div>
    );
  }
});

var Taco = React.createClass({
  render: function() {
    return (
      <div className="Taco">
        <h1>{this.props.params.name}</h1>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="taco" path="taco/:name" handler={Taco}/>
  </Route>
);

React.renderComponent(routes, document.body);
