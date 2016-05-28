/*eslint no-console: 0*/
import React from 'react'
import { render } from 'react-dom'
import { History, Link, MatchLocation } from 'react-router'

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
        <h3>Account</h3>
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
            <li><Link to={`${location.pathname}/435`}>Zillow Group</Link></li>
            <li><Link to={`${location.pathname}/435`}>Yahoo</Link></li>
          </ul>
        )}

        {/* define your "child routes" right here instead of magical
            `this.props.children` that got rendered for you */}
        <MatchLocation
          pattern={`${pattern}/:id`}
          location={location}
          children={Account}
        />
      </div>
    )
  }
}

class App extends React.Component {
  render() {
    return (
      <History>
        {({ location }) => (
          <div>
            <h1>History!</h1>

            <ul>
              <li><Link to="/foo">foo</Link></li>
              <li><Link to="/bar">bar</Link></li>
              <li><Link to="/accounts">accounts</Link></li>
            </ul>

            <MatchLocation pattern="/foo" location={location} children={Foo}/>
            <MatchLocation pattern="/bar" location={location} children={Bar}/>
            <MatchLocation pattern="/accounts" location={location} children={Accounts}/>

          </div>
        )}
      </History>
    )
  }
}

render(<App/>, document.getElementById('app'))

