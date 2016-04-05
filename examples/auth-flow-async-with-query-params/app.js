import React, { createClass, PropTypes } from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, browserHistory, Link } from 'react-router'

function App(props) {
  return (
    <div>
      {props.children}
    </div>
  )
}

const Form = createClass({
  contextTypes: {
    router: PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      value: ''
    }
  },

  submitAction(event) {
    event.preventDefault()
    this.context.router.push({
      pathname: '/page',
      query: {
        qsparam: this.state.value
      }
    })
  },

  handleChange(event) {
    this.setState({ value: event.target.value })
  },

  render() {
    return (
      <form onSubmit={this.submitAction}>
        <p>Token is <em>pancakes</em></p>
        <input type="text" value={this.state.value} onChange={this.handleChange} />
        <button type="submit">Submit the thing</button>
        <p><Link to="/page?qsparam=pancakes">Or authenticate via URL</Link></p>
        <p><Link to="/page?qsparam=bacon">Or try failing to authenticate via URL</Link></p>
      </form>
    )
  }
})

function Page() {
  return <h1>Hey I see you are authenticated.</h1>
}

function ErrorPage() {
  return <h1>Oh no! your auth failed!</h1>
}

function requireCredentials(nextState, replace, next) {
  const query = nextState.location.query
  if (query.qsparam) {
    serverAuth(query.qsparam)
    .then(
      () => next(),
      () => {
        replace('/error')
        next()
      }
    )
  } else {
    replace('/error')
    next()
  }
}

function serverAuth(authToken) {
  return new Promise((resolve, reject) => {
    // That server is gonna take a while
    setTimeout(() => {
      if(authToken === 'pancakes') {
        resolve('authenticated')
      } else {
        reject('nope')
      }
    }, 200)
  })
}

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Form} />
      <Route path="page" component={Page} onEnter={requireCredentials}/>
      <Route path="error" component={ErrorPage}/>
    </Route>
  </Router>
), document.getElementById('example'))
