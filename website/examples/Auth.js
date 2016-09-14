/*eslint-disable import/no-unresolved*/
import React, { PropTypes } from 'react'
import Match from 'react-router/Match'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page<
// 3. Log in
// 4. Click the back button, note the url each time

////////////////////////////////////////////////////////////
const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true
    setTimeout(cb, 100) // fake async
  },
  signout(cb) {
    this.isAuthenticated = false
    cb()
    setTimeout(cb, 100) // weird bug if async?
  }
}

////////////////////////////////////////////////////////////
const AuthExample = () => (
  <Router>
    {({ router }) => (
      <div>
        {fakeAuth.isAuthenticated ? (
          <p>
            Welcome! {' '}
            <button onClick={() => {
              fakeAuth.signout(() => {
                router.transitionTo('/')
              })
            }}>Sign out</button>
          </p>
        ) : (
          <p>You are not logged in.</p>
        )}

        <ul>
          <li><Link to="/public">Public Page</Link></li>
          <li><Link to="/protected">Protected Page</Link></li>
        </ul>

        <Match pattern="/public" component={Public}/>
        <Match pattern="/login" component={Login}/>
        <MatchWhenAuthorized pattern="/protected" component={Protected}/>
      </div>
    )}
  </Router>
)

////////////////////////////////////////////////////////////
const MatchWhenAuthorized = ({ component: Component, ...rest }) => (
  <Match {...rest} render={props => (
    fakeAuth.isAuthenticated ? (
      <Component {...props}/>
    ) : (
      <Redirect to={{
        pathname: '/login',
        state: { from: props.location }
      }}/>
    )
  )}/>
)


////////////////////////////////////////////////////////////
const Protected = () => <h3>Protected</h3>
const Public = () => <h3>Public</h3>


////////////////////////////////////////////////////////////
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
    const { from } = this.props.location.state
    const { redirectToReferrer } = this.state

    return (
      <div>
        {redirectToReferrer && (
          <Redirect to={from || '/'}/>
        )}
        {from && (
          <p>
            You must log in to view the page at
            <code>{from.pathname}</code>
          </p>
        )}
        <button onClick={this.login}>Log in</button>
      </div>
    )
  }
}



export default AuthExample
