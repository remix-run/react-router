/*eslint no-console: 0*/
import React from 'react'
import { render } from 'react-dom'
import { History, Link, MatchLocation } from 'react-history'

const { object } = React.PropTypes

const Stringify = ({ val }) => (
  <pre>{JSON.stringify(val, null, 2)}</pre>
)

class Foo extends React.Component {
  render() {
    return (
      <div>
        <h2>Foo</h2>
      </div>
    )
  }
}

class Bar extends React.Component {
  render() {
    return (
      <div>
        <h2>Bar</h2>
      </div>
    )
  }
}

class Account extends React.Component {

  // this is a bit of work to block a transition, BUT IT WORKS GREAT :D
  // can clean up with a history enhancer or, dare I suggest, a
  // higher order component? I think HoC might be the way to go :|
  static contextTypes = { history: object }

  blockHistory = () => {
    if (!this.unlistenBefore) {
      this.unlistenBefore = this.context.history.listenBefore((location) => (
        `Are you sure you want to go to ${location.pathname} before submitting the form?`
      ))
    }
  }

  unblockHistory = () => {
    if (this.unlistenBefore) {
      this.unlistenBefore()
      this.unlistenBefore = null
    }
  }

  componentWillUnmount = this.unblockHistory

  handleSubmit = (event) => {
    event.preventDefault()
    event.target.reset()
    this.unblockHistory()
  }

  render() {
    return (
      <div>
        <h3>Account {this.props.params.id}</h3>
        <form
          onChange={this.blockHistory}
          onSubmit={this.handleSubmit}
        >
          <input placeholder="type here to block history transitions"/>
          <button type="submit">
            Submit (and unblock)
          </button>
        </form>
        <Stringify val={this.props}/>
      </div>
    )
  }
}


// compose this crap :D
class ChildLink extends React.Component {
  static contextTypes = { location: object }
  render = () => {
    const { location, to, ...rest } = this.props
    const loc = location || this.context.location
    return <Link {...rest} to={`${loc.pathname}/${to}`}/>
  }
}

class Accounts extends React.Component {
  render() {
    const { pattern, location, isTerminal } = this.props
    return (
      <div>
        <h2>Accounts</h2>

        {/* don't need index routes, just tell me if I'm terminal! */}
        {isTerminal && (
          <ul>
            <li><Link to={`${location.pathname}/123`}>Netflix</Link></li>
            <li><ChildLink to="435">Zillow Group</ChildLink></li>
            <li><ChildLink to="837">Yahoo</ChildLink></li>
          </ul>
        )}

        {/* define your "child routes" right here instead of magical
            `this.props.children` that got rendered for you, and
             send whatever extra props you want, you own rendering */}
        <MatchLocation pattern={`${pattern}/:id`} children={(props) => (
          <Account {...props} more="stuff"/>
        )} />
      </div>
    )
  }
}


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

const ProtectedPaths = ({ children }) => (
  <div>
    {fakeAuth.isAuthenticated && children}
  </div>
)

class Auth extends React.Component {

  static contextTypes = { history: object }

  login = () => {
    fakeAuth.authenticate(() => this.forceUpdate())
  }

  signout = () => {
    fakeAuth.signout(() => {
      this.context.history.push('/auth')
    })
  }

  render = () => (
    <div>
      <h2>Auth</h2>
      {fakeAuth.isAuthenticated ? (
        <div>
          <p>You are logged in!</p>
          <button onClick={this.signout}>Sign out</button>
        </div>
      ) : (
        <button onClick={this.login}>Log in</button>
      )}

      <ProtectedPaths>
        <MatchLocation pattern="/auth/nested" children={() => (
          <p>Nested under auth</p>
        )}/>
      </ProtectedPaths>
    </div>
  )
}

const NavLink = (props) => (
  <Link {...props} activeStyle={{ color: 'green' }}/>
)

class App extends React.Component {
  render() {
    return (
      <History>
        <h1>History!</h1>

        <ul>
          <li><NavLink to="/" activeOnlyWhenExact>Home</NavLink></li>
          <li><NavLink to="/auth/nested">Auth Example</NavLink></li>
          <li><NavLink to="/accounts">Blocking Transitions</NavLink></li>
          <li><NavLink to="/foo" activeOnlyWhenExact>foo</NavLink></li>
          <li><NavLink to="/foo/bar">foo/bar</NavLink></li>
          <li><NavLink to="/bar">bar</NavLink></li>
        </ul>

        <MatchLocation pattern="/" children={() => (
          <h1>Welcome to the future of routing with React!</h1>
        )}/>

        <MatchLocation pattern="/foo" activeOnlyWhenExact children={Foo}/>
        <MatchLocation pattern="/foo/bar" children={() => <div>foo bar</div>}/>
        <MatchLocation pattern="/bar" children={Bar}/>
        <MatchLocation pattern="/accounts" children={(props) => (
          <Accounts {...props} somethingFromHere="cool"/>
        )}/>

        <MatchLocation pattern="/auth" children={Auth}/>

      </History>
    )
  }
}

render(<App/>, document.getElementById('app'))

