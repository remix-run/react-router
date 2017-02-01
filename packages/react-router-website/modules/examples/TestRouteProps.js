import React from 'react'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'

const PathExample = () => (
  <Router>
    <App />
  </Router>
)

const MatchIndicator = ({ color }) => (
  <span style={{
    background: color,
    width: 25,
    height: 25,
    borderRadius: 15,
    display: 'inline-block'
  }}></span>
)

class App extends React.Component {
  state = {
    path: '',
    exact: false,
    strict: false
  }

  handleInput(event) {
    const target = event.target
    this.setState({
      [target.name]: target.type === 'checkbox' ? target.checked : target.value
    })
  }

  render() {
    const {
      path,
      exact,
      strict
    } = this.state
    return (
      <div>
        <pre style={{ background: '#efefef' }}>
          <code>
            {'<Route'}
            <br />
            <label>{'  path="'}
              <input
                type='text'
                name='path'
                value={path}
                onChange={this.handleInput.bind(this)}
                />{'"'}
            </label>
            <br />
            <label>{'  exact={'}
              <input
                type='checkbox'
                name='exact'
                value={exact}
                onChange={this.handleInput.bind(this)}
                />
              {'}'}
            </label>
            <br />
            <label>{'  strict={'}
              <input
                type='checkbox'
                name='strict'
                value={strict}
                onChange={this.handleInput.bind(this)}
                />
              {'}'}
            </label>
            <br />
            {'  />'}
          </code>
        </pre>
        <Route path={path} strict={strict} exact={exact} children={({ match }) => (
          <div>  
            <MatchIndicator color={match ? 'green' : 'red'} />
            <pre>
              <code>
                { JSON.stringify(match, null, 2) }
              </code>
            </pre>
          </div>
        )} />
      </div>
    )
  }
}

export default PathExample
