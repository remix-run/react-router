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

class TestRoute extends React.Component {
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
      <Route path={path} strict={strict} exact={exact} children={({ match }) => (
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
                  title='A path should begin with a forward slash (/)'
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
          <pre style={{
            color: match ? 'green' : 'red',
          }}>
            <code>
              { JSON.stringify(match, null, 2) }
            </code>
          </pre>
        </div>
      )} />
    )
  }
}

const MatchIndicator = ({ color }) => (
  <span style={{
    background: color,
    width: 25,
    height: 25,
    borderRadius: 15,
    display: 'inline-block'
  }}></span>
)

const URLInput = () => (
  <Route render={({ location, replace }) => (
    <div>
      <h2>Pathname:</h2>
      <div>
        <input
          type='text'
          placeholder='Pathname'
          value={location.pathname}
          style={{ width: '100%' }}
          onChange={(event) => { replace(event.target.value) }}
          />
      </div>
    </div>
    )}
    />
)

const App = () => (
  <div>
    <p>
      Test &lt;Route&gt; configuration by setting the <a href='#route.path'>path</a>,
      {' '}<a href='#route.exact'>exact</a> and <a href='#route.strict'>strict</a> props.
      The &lt;Route&gt; will be matched against the current URL's pathname.
    </p>
    <br />
    <p>
      To change URLs, type in the Pathname text input below and the address bar
      will be automatically updated. The URL's pathname will then be compared
      against the current &lt;Route&gt; configuration. When a &lt;Route&gt;
      matches the current location, its <a href='#match'>match</a> object
      will be displayed below.
    </p>
    <br />
    <URLInput />
    <TestRoute />
  </div>
)
  
export default PathExample
