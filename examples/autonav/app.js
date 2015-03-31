var React = require('react');
var Router = require('react-router');
var { Route, RouteHandler, Link, DefaultRoute } = Router;

class Nav extends React.Component {
  render() {
    var routes = this.context.router.getCurrentRoutes()[0].childRoutes;

    return (
      <nav className="Nav" role="navigation">
        <header className="Nav-header">Navigation</header>
        <ul role="tablist" className="Nav-list">
          {routes.map(i => (
            <li className="Nav-item" key={i.path || i.defaultRoute.name}>
              <Link
                className="Nav-link"
                to={i.path || i.defaultRoute.name}
                >{i.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
}

Nav.contextTypes = {
  router: React.PropTypes.func
};

class App extends React.Component {
  render () {
    return (
      <div>
        <Nav />
        <RouteHandler/>
      </div>
    );
  }
}

class Dashboard extends React.Component {
  render () {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
      </div>
    );
  }
}

class About extends React.Component {
  render () {
    return (
      <div>
        <h1>About</h1>
        <p>The navigation above was generated automatically with a <code>Toc</code> component.</p>
      </div>
    );
  }
}

class Inbox extends React.Component {
  render () {
    return <h1>Inbox</h1>;
  }
}


// Fake authentication lib

var routes = (
  <Route handler={App}>
    <DefaultRoute name="about" handler={About}/>
    <Route name="dashboard" handler={Dashboard}/>
    <Route name="inbox" handler={Inbox}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});

