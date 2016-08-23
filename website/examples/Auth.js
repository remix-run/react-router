import React, { PropTypes } from 'react'
import { Router, Match, Link, Redirect } from 'react-router'


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
    //setTimeout(cb, 100) // weird bug if async?
  }
}


////////////////////////////////////////////////////////////
const Protected = () => <h3>Protected</h3>
const Public = () => <h3>Public</h3>


////////////////////////////////////////////////////////////
class Login extends React.Component {
  static contextTypes = {
    location: PropTypes.object,
    router: PropTypes.object
  }

  login = () => {
    const { location } = this.props

    fakeAuth.authenticate(() => {
      this.context.router.replaceWith(location.state.from)
    })
  }

  render() {
    const { from } = this.props.location.state

    return (
      <div>
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
class AuthExample extends React.Component {
  signout = () => {
    fakeAuth.signout(() => {
      this.props.history.push('/')
      // FIXME: why do we stay at /protected? when 
      // there's a setTimeout?
    })
  }

  render() {
    return (
      <Router history={this.props.history}>
        <ol style={{
          padding: '10px 30px',
          background: 'hsl(53, 81%, 75%)'
        }}>
          <li>Click the public page</li>
          <li>Click the protected page</li>
          <li>Log in</li>
          <li>
            Click the back button, note the url each time
          </li>
        </ol>

        <div>
          {fakeAuth.isAuthenticated ? (
            <p>
              Welcome! {' '}
              <button onClick={this.signout}>Sign out</button>
            </p>
          ) : (
            <p>You are not logged in.</p>
          )}
        </div>

        <ul>
          <li><Link to="/public">Public Page</Link></li>
          <li><Link to="/protected">Protected Page</Link></li>
        </ul>

        <Match pattern="/public" component={Public}/>
        <Match pattern="/login" component={Login}/>
        <MatchWhenAuthorized pattern="/protected" component={Protected}/>
      </Router>
    )
  }
}

export default AuthExample
