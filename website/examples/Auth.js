import React, { PropTypes } from 'react'
import Router from 'react-router/BrowserRouter'
import Route from 'react-router/Route'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page
// 3. Log in
// 4. Click the back button, note the URL each time

const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true
    setTimeout(cb, 100) // fake async
  },
  signout(cb) {
    this.isAuthenticated = false
    setTimeout(cb, 100)
  }
}

class AuthExample extends React.Component {
  render() {
    return (
      <Router>
        {({ history }) => (
          <div>
            {fakeAuth.isAuthenticated ? (
              <p>
                Welcome! <button onClick={() => {
                  fakeAuth.signout(() => history.push('/'))
                }}>Sign out</button>
              </p>
            ) : (
              <p>You are not logged in.</p>
            )}

            <ul>
              <li><Link to="/public">Public Page</Link></li>
              <li><Link to="/protected">Protected Page</Link></li>
            </ul>

            <Route path="/public" component={Public}/>
            <Route path="/login" component={Login}/>
            <PrivateRoute path="/protected" component={Protected}/>
          </div>
        )}
      </Router>
    )
  }
}

const PrivateRoute = ({ component, ...rest }) => (
  <Route {...rest} render={props => (
    fakeAuth.isAuthenticated ? (
      React.createElement(component, props)
    ) : (
      <Redirect to={{
        pathname: '/login',
        state: { from: props.location }
      }}/>
    )
  )}/>
)

const Public = () => <h3>Public</h3>
const Protected = () => <h3>Protected</h3>

class Login extends React.Component {
  state = {
    redirectToReferrer: false
  }

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true })
    })
  }

  render() {
    const { from } = this.props.location.state || '/'
    const { redirectToReferrer } = this.state

    return (
      <div>
        {redirectToReferrer && (
          <Redirect to={from || '/'}/>
        )}
        {from && (
          <p>
            You must log in to view the page at {from.pathname}
          </p>
        )}
        <button onClick={this.login}>Log in</button>
      </div>
    )
  }
}

export default AuthExample
