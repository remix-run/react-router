var React = require('react');
var { Route, createRouter, Link, Navigation } = require('react-router');
var HashHistory = require('react-router/HashHistory');

var App = React.createClass({

  mixins: [ Navigation ],

  getInitialState: function () {
    return {
      tacos: [
        { name: 'duck confit' },
        { name: 'carne asada' },
        { name: 'shrimp' }
      ]
    };
  },

  addTaco: function () {
    var name = prompt('taco name?');
    this.setState({
      tacos: this.state.tacos.concat({name: name})
    });
  },

  handleRemoveTaco: function (removedTaco) {
    var tacos = this.state.tacos.filter(function (taco) {
      return taco.name != removedTaco;
    });
    this.setState({tacos: tacos});
    this.transitionTo('/');
  },

  render: function () {
    var links = this.state.tacos.map(function (taco, i) {
      return (
        <li key={i}>
          <Link to="taco" params={taco}>{taco.name}</Link>
        </li>
      );
    });
    return (
      <div className="App">
        <button onClick={this.addTaco}>Add Taco</button>
        <ul className="Master">
          {links}
        </ul>
        <div className="Detail">
          {this.props.children && React.cloneElement(this.props.children, {
            onRemoveTaco: this.handleRemoveTaco
          })}
        </div>
      </div>
    );
  }
});

var Taco = React.createClass({

  remove: function () {
    this.props.onRemoveTaco(this.props.params.name);
  },

  render: function () {
    return (
      <div className="Taco">
        <h1>{this.props.params.name}</h1>
        <button onClick={this.remove}>remove</button>
      </div>
    );
  }
});

var Router = createRouter(
  <Route component={App}>
    <Route name="taco" path="taco/:name" component={Taco}/>
  </Route>
);

React.render(<Router history={HashHistory}/>, document.getElementById('example'));
