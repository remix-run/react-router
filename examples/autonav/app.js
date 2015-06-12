import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import { Router, Route, Link } from 'react-router';

class Nav extends React.Component {
  render() {
    var routes = this.context.router.routes[0].childRoutes;

    return (
      <nav className="Nav" role="navigation">
        <header className="Nav-header">Navigation</header>
        <ul role="tablist" className="Nav-list">
          {routes.map((i, to) => (
            (to = i.name || i.path || i.defaultRoute.name),
            <li className="Nav-item" key={to}>
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

Nav.contextTypes = {router: React.PropTypes.object.isRequired};

class App extends React.Component {
  render () {
    return (
      <div>
        <Nav />
        {this.props.children || <About />}
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
  <Router history={HashHistory}>
    <Route name="Root" path="/" component={App}>
      <Route path="dashboard" name="dashboard" component={Dashboard}/>
      <Route path="inbox" name="inbox" component={Inbox}/>
    </Route>
  </Router>
);

React.render(routes, document.getElementById('example'));


