import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import Link from 'react-router/Link'

const CustomLinkExample = () => (
  <Router>
    <div>
      <Link activeOnlyWhenExact to="/">{({ isActive, onClick, href }) => <OldSchoolMenuLink label="Home" onClick={onClick} href={href} isActive={isActive}/>}</Link>
      <Link to="/about">{(params) => <OldSchoolMenuLink label="About" {...params}/>}</Link>

      <hr/>

      <Match exactly pattern="/" component={Home} />
      <Match pattern="/about" component={About} />
    </div>
  </Router>
)

const OldSchoolMenuLink = ({ onClick, href, isActive, label }) => (
  <div className={isActive ? 'active' : ''}>
    {isActive ? '> ' : ''}
    <a href={href} onClick={onClick}>
      {label}
    </a>
  </div>
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
