import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import MatchRoutes from 'react-router/MatchRoutes'
import Link from 'react-router/Link'

const MatchRoutesExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/topics">Topics</Link></li>
      </ul>

      <hr/>

      <MatchRoutes
        routes={[
          { pattern: '/',
            exactly: true,
            component: Home
          },
          { pattern: '/about',
            component: About
          },
          { pattern: '/topics',
            component: Topics
          }
        ]}
        renderMiss={() => (
          <div>SNAP! We missed</div>
        )}
      />
    </div>
  </Router>
)

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
)

const About = () => (
  <div>
    <h2>About</h2>
  </div>
)

const Topics = ({ pathname }) => (
  <div>
    <h2>Topics</h2>
    <ul>
      <li><Link to={`${pathname}/rendering`}>Rendering with React</Link></li>
      <li><Link to={`${pathname}/components`}>Components</Link></li>
      <li><Link to={`${pathname}/props-v-state`}>Props v. State</Link></li>
    </ul>

    <Match pattern={`${pathname}/:topicId`} component={Topic}/>
    <Match pattern={pathname} exactly render={() => (
      <h3>Please select a topic</h3>
    )}/>
  </div>
)

const Topic = ({ params }) => (
  <div>
    <h3>{params.topicId}</h3>
  </div>
)

export default MatchRoutesExample
