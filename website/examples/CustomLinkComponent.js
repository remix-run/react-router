// To run this example locally, create a new project with 
// 'create-react-app', install the router with 'npm i react-router@next',
// then copy/paste the code below into `src/App.js` of your new project.
//  For more info on 'create-react-app', see https://github.com/facebookincubator/create-react-app

import React from 'react'
import Match from 'react-router/Match'
import Link from 'react-router/Link'
import Router from 'react-router/BrowserRouter'

const OldSchoolMenuLink = ({onClick, href, isActive, label}) => (
  <div className={isActive ? 'active' : ''}>
    {isActive ? '> ' : ''}
    <a href={href} onClick={onClick}>
      {label}
    </a>
  </div>
)


class CustomLinkComponent extends React.Component {
  render() {
    return (
      <Router>
        <div>
          <Link activeOnlyWhenExact to="/">{ ({isActive, onClick, href}) => <OldSchoolMenuLink label="Home" onClick={onClick} href={href} isActive={isActive} /> }</Link>
          <Link to="/about">{ (params) => <OldSchoolMenuLink label="About" {...params} /> }</Link>

          <hr/>

          <Match exactly pattern="/" component={Home} />
          <Match pattern="/about" component={About} />
        </div>
      </Router>
    )
  }
}

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

export default CustomLinkComponent

