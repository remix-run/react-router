var React = require('react');
var Router = require('react-router');
var { Route, RouteHandler, Link } = Router;

var App = React.createClass({

  contextTypes: {
    router: React.PropTypes.func.isRequired
  },

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
    this.context.router.transitionTo('/');
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
          <RouteHandler onRemoveTaco={this.handleRemoveTaco}/>
        </div>
      </div>
    );
  }
});

var Taco = React.createClass({

  contextTypes: {
    router: React.PropTypes.func.isRequired
  },

  remove: function () {
    this.props.onRemoveTaco(this.context.router.getCurrentParams().name);
  },

  render: function () {
    return (
      <div className="Taco">
        <h1>{this.context.router.getCurrentParams().name}</h1>
        <button onClick={this.remove}>remove</button>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="taco" path="taco/:name" handler={Taco}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});
