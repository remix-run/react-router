import React from 'react'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

const Child = ({ location }) => (
  <pre>{JSON.stringify(location.query, null, 2)}</pre>
)

const QueryParamsExample = () => {
  return (
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
}

export default QueryParamsExample

