import React from 'react'
import { createHistory, useBasename } from 'history'
import { Router, Route, IndexRoute, Link } from 'react-router'

const history = useBasename(createHistory)({
  basename: '/redirect-using-index'
})

class App extends React.Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>You should not see this.</h1>
        {this.props.children}
      </div>
    )
  }
}

class Child extends React.Component {
  render() {
    return (
      <div>
        <h2>Redirected to "/child"</h2>
        <Link to="/">Try going to "/"</Link>
      </div>
    )
  }
}

function redirectToChild(location, replaceState) {
  replaceState(null, '/child')
}

React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Index} onEnter={redirectToChild} />
      <Route path="/child" component={Child} />
    </Route>
  </Router>
), document.getElementById('example'))
