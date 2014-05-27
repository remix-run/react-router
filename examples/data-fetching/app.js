/** @jsx React.DOM */
var React = require('react');
var ReactRouter = require('../../lib/main');
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var superagent = require('superagent');

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="home" path="/" handler={Home}/>
        <Route name="info" path="info/:framework" handler={Info} />
      </Routes>
    );
  }
});

var App = React.createClass({

  render: function() {
    return (
      <div>
        <h1>JS Framework Knowledgebase</h1>
        <ul>
          <li><Link to="home">Home</Link></li>
          <li><Link to="info" framework="Angular">Angular</Link></li>
          <li><Link to="info" framework="Ember">Ember</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var Home = React.createClass({
  render: function() {
    return <div>Please choose a JS framework to learn about.</div>;
  }
});

var DataFetchingMixin = {
  getInitialState: function() {
    return {data: this.props.initialData};
  },

  getDefaultProps: function() {
    return {initialData: null};
  },

  componentWillMount: function() {
    if (!this.props.initialData) {
      this.fetch(this.props);
    }
  },

  fetch: function(props) {
    this.constructor.fetchData(this.props, function(data) {
      this.setState({data: data});
    }.bind(this));
  }

  // TODO: may need to implement componentWillReceiveProps()

};

var Info = React.createClass({
  mixins: [DataFetchingMixin],

  statics: {
    // TODO: for server rendering, the Router should call
    // this static method *before* rendering, and when the
    // data is ready instantiate the component with an initialData
    // prop.
    fetchData: function(props, cb) {
      superagent.get('http://foaas.com/linus/' + props.params.framework + '/React', function(res) {
        cb(res.text);
      });
    }
  },
  render: function() {
    return <div>The latest info we have on {this.props.params.framework} is: <strong>{this.state.data}</strong></div>;
  }
});

React.renderComponent(<Main/>, document.body);
