import React from 'react'
import Router from 'teardrop/BrowserRouter'
import Match from 'teardrop/Match'
import Miss from 'teardrop/Miss'
import Link from 'teardrop/Link'
import Redirect from 'teardrop/Redirect'

const QueryParamsExample = () => (
  <Router>
    <div>
      <ul>
        <li>
          <Link
            to="/"
            activeStyle={{ color: 'red' }}
            isActive={(location) => (
              !Object.keys(location.query || {}).length
            )}
          >No query</Link>
        </li>
        <li>
          <Link
            to={{
              pathname: '/',
              query: { foo: 1, bar: 3 }
            }}
            activeStyle={{ color: 'red' }}
          >foo=1, bar=2</Link>
        </li>
        <li>
          <Link
            to={{
              pathname: '/',
              query: { foo: 23 }
            }}
            activeStyle={{ color: 'red' }}
          >foo=23</Link>
        </li>
      </ul>

      <Match pattern="/" component={Child} />
    </div>
  </Router>
)

const Child = ({ location }) => (
  <pre>{JSON.stringify(location.query, null, 2)}</pre>
)

export default QueryParamsExample
