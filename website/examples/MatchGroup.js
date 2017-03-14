import React from 'react'
import Router from 'teardrop/BrowserRouter'
import Match from 'teardrop/Match'
import Miss from 'teardrop/Miss'
import MatchGroup from 'teardrop/MatchGroup'
import Link from 'teardrop/Link'

const MatchGroupExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/topics">Topics</Link></li>
      </ul>

      <hr/>

      <MatchGroup>
        <Match exactly pattern="/" component={Home} />
        <Match pattern="/about" component={About} />
        <Match pattern="/topics" component={Topics} />
        <Miss render={() => <div>SNAP! We missed</div>}/>
      </MatchGroup>
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

export default MatchGroupExample
