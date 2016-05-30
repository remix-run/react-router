import React from 'react'
import { MatchLocation, Link } from 'react-history'

const { object } = React.PropTypes

////////////////////////////////////////////////////////////////////////////////
const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    setTimeout(() => {
      this.isAuthenticated = true
      cb()
    }, 100)
  },
  signout(cb) {
    setTimeout(() => {
      this.isAuthenticated = false
      cb()
    }, 100)
  }
}

////////////////////////////////////////////////////////////////////////////////
const Protected = () => <h3>Protected</h3>
const Public = () => <h3>Public</h3>


////////////////////////////////////////////////////////////////////////////////
class Login extends React.Component {

  static contextTypes = { history: object, location: object }

  login = () => {
    const { history } = this.context
    const { location } = this.props
    fakeAuth.authenticate(() => {
      const from = location.state && location.state.from
      history.replace(from || '/auth')
    })
  }

  render() {
    const { location } = this.context
    const from = location.state && location.state.from
    return (
      <div>
        {from && (
          <p>You must log in to view the page at <code>{from}</code></p>
        )}
        <button onClick={this.login}>Log in</button>
      </div>
    )
  }

}

////////////////////////////////////////////////////////////////////////////////
class Redirect extends React.Component {

  static contextTypes = {
    history: object
  }

  componentDidMount() {
    const { to, from } = this.props
    const { history } = this.context
    history.replace({
      pathname: to,
      state: { from }
    })
  }

  render() {
    return null
  }

}


////////////////////////////////////////////////////////////////////////////////
const MatchWhenAuthorized = ({ children:Child, ...rest }) => (
  <MatchLocation {...rest} children={(props) => (
    fakeAuth.isAuthenticated ? (
      <Child {...props}/>
    ) : (
      <Redirect to="/auth/login" from={props.location.pathname}/>
    )
  )}/>
)


////////////////////////////////////////////////////////////////////////////////
class Auth extends React.Component {

  static contextTypes = { history: object }

  signout = () => {
    fakeAuth.signout(() => this.context.history.push('/auth'))
  }

  render = () => (
    <div>
      <h2>Auth</h2>

      <ol style={{ padding: '10px 30px', background: 'hsl(53, 81%, 75%)' }}>
        <li>Click the public page</li>
        <li>Click the protected page</li>
        <li>Log in</li>
        <li>Click the back button, note the url each time</li>
      </ol>

      <div>
        {fakeAuth.isAuthenticated ? (
          <p>Welcome! <button onClick={this.signout}>Sign out</button></p>
        ) : (
          <p>You are not logged in.</p>
        )}
      </div>

      <ul>
        <li><Link to="/auth/public">Public Page</Link></li>
        <li><Link to="/auth/protected">Protected Page</Link></li>
      </ul>

      <MatchWhenAuthorized pattern="/auth/protected" children={Protected}/>
      <MatchLocation pattern="/auth/public" children={Public}/>
      <MatchLocation pattern="/auth/login" children={Login}/>

    </div>
  )
}

export default Auth

