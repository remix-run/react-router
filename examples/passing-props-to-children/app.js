var React = require('react');
var { Router, Route, Link, Navigation, HashHistory } = require('react-router');

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
          <Link to={`/taco/${taco.name}`}>{taco.name}</Link>
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

React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="taco/:name" component={Taco}/>
    </Route>
  </Router>
), document.getElementById('example'));
