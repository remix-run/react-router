import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import Link from 'react-router/Link'

const CustomLinkExample = () => (
  <Router>
    <div>
      <OldSchoolMenuLink activeOnlyWhenExact={true} to="/" label="Home"/>
      <OldSchoolMenuLink to="/about" label="About"/>

      <hr/>

      <Match exactly pattern="/" component={Home} />
      <Match pattern="/about" component={About} />
    </div>
  </Router>
)

const OldSchoolMenuLink = ({ label, to, activeOnlyWhenExact }) => (
  <Match pattern={to} exactly={activeOnlyWhenExact}>
    {({ matched }) => (
      <div className={matched ? 'active' : ''}>
        {matched ? '> ' : ''}
        <Link to={to} activeOnlyWhenExact={activeOnlyWhenExact}>
          {label}
        </Link>
      </div>
    )}
  </Match>
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

export default CustomLinkExample
