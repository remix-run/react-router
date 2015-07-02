var About = React.createClass({/*...*/});
var Inbox = React.createClass({/*...*/});
var Home = React.createClass({/*...*/});

var App = React.createClass({
  getInitialState () {
    return {
      route: window.location.hash.substr(1)
    };
  },

  componentDidMount () {
    window.addEventListener('hashchange', () => {
      this.setState({
        route: window.location.hash.substr(1)
      });
    });
  },

  render () {
    var Child;
    switch (this.state.route) {
      case '/about': Child = About; break;
      case '/inbox': Child = Inbox; break;
      default:      Child = Home;
    }

    return (
      <div>
      <h1>App</h1>
      <ul>
      <li><a href="#/about">About</a></li>
    <li><a href="#/inbox">Inbox</a></li>
    </ul>
    <Child/>
    </div>
  )
  }
});

React.render(<App />, document.body);
