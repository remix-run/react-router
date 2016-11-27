import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'

// Each "route" has two components, one for the sidebar
// and one for the main area, we'll render them
// simultaneously when the pattern matches
const routes = [
  { pattern: '/',
    exactly: true,
    sidebar: () => <div>Home!</div>,
    main: () => <h2>Main</h2>
  },
  { pattern: '/foo',
    sidebar: () => <div>foo!</div>,
    main: () => <h2>Foo</h2>
  },
  { pattern: '/bar',
    sidebar: () => <div>Bar!</div>,
    main: () => <h2>Bar</h2>
  }
]

const SidebarExample = () => (
  <Router>
    <div style={{ display: 'flex' }}>
      <div style={{
        padding: '10px',
        width: '40%',
        background: '#f0f0f0'
      }}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/foo">Foo</Link></li>
          <li><Link to="/bar">Bar</Link></li>
        </ul>

        {routes.map((route, index) => (
          // you can render a match in as many places
          // as you want in your app, it will match with
          // any other `Match`s that have the same
          // pattern. So, a sidebar, or breadcrumbs, or
          // anything else that requires you to render
          // multiple things in multiple places at the
          // same location is nothing more than multiple
          // `Match`s
          <Match
            key={index}
            pattern={route.pattern}
            component={route.sidebar}
            exactly={route.exactly}
          />
        ))}
      </div>

      <div style={{ flex: 1, padding: '10px' }}>
        {routes.map((route, index) => (
          // rendering `Match`s with different
          // components but the same pattern as before
          <Match
            key={index}
            pattern={route.pattern}
            component={route.main}
            exactly={route.exactly}
          />
        ))}
      </div>
    </div>
  </Router>
)

export default SidebarExample
