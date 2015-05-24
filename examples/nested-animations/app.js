var React = require('react');
var TransitionGroup = require('react/lib/ReactCSSTransitionGroup');
var Router = require('react-router');
var { Route, RouteHandler, Link } = Router;

var App = React.createClass({

  contextTypes: {
    router: React.PropTypes.func
  },

  render: function () {
    var name = this.context.router.getCurrentPath();
    // Only take the first-level part of the path as key, instead of the whole path.
    var key = name.split('/')[1] || 'root';
    return (
      <div>
        <ul>
          <li><Link to="page1">Page 1</Link></li>
          <li><Link to="page2">Page 2</Link></li>
        </ul>
        <TransitionGroup component="div" transitionName="swap">
          <RouteHandler key={key}/>
        </TransitionGroup>
      </div>
    );
  }
});

var Page1 = React.createClass({

    contextTypes: {
      router: React.PropTypes.func
    },

  render: function () {
    var name = this.context.router.getCurrentPath();
    return (
      <div className="Image">
        <h1>Page 1</h1>
        <ul>
          <li><Link to="page1-tab1">Tab 1</Link></li>
          <li><Link to="page1-tab2">Tab 2</Link></li>
        </ul>
        <TransitionGroup component="div" transitionName="example">
          <RouteHandler key={name}/>
        </TransitionGroup>
      </div>
    );
  }
});

var Page2 = React.createClass({

    contextTypes: {
      router: React.PropTypes.func
    },

  render: function () {
    var name = this.context.router.getCurrentPath();
    return (
      <div className="Image">
        <h1>Page 2</h1>
        <ul>
          <li><Link to="page2-tab1">Tab 1</Link></li>
          <li><Link to="page2-tab2">Tab 2</Link></li>
        </ul>
        <TransitionGroup component="div" transitionName="example">
          <RouteHandler key={name}/>
        </TransitionGroup>
      </div>
    );
  }
});

var Tab1 = React.createClass({
  render: function () {
    return (
      <div className="Image">
        <h2>Tab 1</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var Tab2 = React.createClass({
  render: function () {
    return (
      <div className="Image">
        <h2>Tab 2</h2>
        <p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="page1" handler={Page1}>
      <Route name="page1-tab1" path="tab1" handler={Tab1} />
      <Route name="page1-tab2" path="tab2" handler={Tab2} />
    </Route>
    <Route name="page2" handler={Page2}>
      <Route name="page2-tab1" path="tab1" handler={Tab1} />
      <Route name="page2-tab2" path="tab2" handler={Tab2} />
    </Route>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});
