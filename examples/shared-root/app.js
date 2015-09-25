import React from 'react'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link } from 'react-router'

const history = useBasename(createHistory)({
  basename: '/shared-root'
})

class App extends React.Component {
  render() {
    return (
      <div>
        <p>
          This illustrates how routes can share UI w/o sharing the URL.
          When routes have no path, they never match themselves but their
          children can, allowing "/signin" and "/forgot-password" to both
          be render in the <code>SignedOut</code> component.
        </p>
        <ol>
          <li><Link to="/home" activeClassName="active">Home</Link></li>
          <li><Link to="/signin" activeClassName="active">Sign in</Link></li>
          <li><Link to="/forgot-password" activeClassName="active">Forgot Password</Link></li>
        </ol>
        {this.props.children}
      </div>
    )
  }
}

class SignedIn extends React.Component {
  render() {
    return (
      <div>
        <h2>Signed In</h2>
        {this.props.children}
      </div>
    )
  }
}

class Home extends React.Component {
  render() {
    return (
      <h3>Welcome home!</h3>
    )
  }
}

class SignedOut extends React.Component {
  render() {
    return (
      <div>
        <h2>Signed Out</h2>
        {this.props.children}
      </div>
    )
  }
}

class SignIn extends React.Component {
  render() {
    return (
      <h3>Please sign in.</h3>
    )
  }
}

class ForgotPassword extends React.Component {
  render() {
    return (
      <h3>Forgot your password?</h3>
    )
  }
}

React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route component={SignedOut}>
        <Route path="signin" component={SignIn} />
        <Route path="forgot-password" component={ForgotPassword} />
      </Route>
      <Route component={SignedIn}>
        <Route path="home" component={Home} />
      </Route>
    </Route>
  </Router>
), document.getElementById('example'))
