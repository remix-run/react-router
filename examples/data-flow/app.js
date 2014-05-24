/** @jsx React.DOM */
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var Main = React.createClass({
  getInitialState: function() {
    return {
      tacos: [
        {name: 'duck confit'},
        {name: 'carne asada'},
        {name: 'shrimp'}
      ]
    };
  },

  addTaco: function(name) {
    this.state.tacos.push({name: name});
    this.setState({tacos: this.state.tacos});
  },

  render: function() {
    return (
      <Routes handler={App} tacos={this.state.tacos} onAddTaco={this.addTaco}>
        <Route name="taco" path="taco/:name" handler={Taco} />
      </Routes>
    );
  }
});

var App = React.createClass({

  addTaco: function() {
    var name = prompt('taco name?');
    this.props.onAddTaco(name);
  },

  render: function() {
    var links = this.props.tacos.map(function(taco) {
      return <li><Link to="taco" name={taco.name}>{taco.name}</Link></li>
    });
    return (
      <div className="App">
        <button onClick={this.addTaco}>Add Taco</button>
        <ul className="Master">
          {links}
        </ul>
        <div className="Detail">
          {this.props.activeRoute}
        </div>
      </div>
    );
  }
});

var Taco = React.createClass({
  render: function() {
    return (
      <div className="Taco">
        <h1>{this.props.name}</h1>
      </div>
    );
  }
});

React.renderComponent(<Main/>, document.body);

