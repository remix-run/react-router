import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'

const AmbiguousExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/about">About Us (static)</Link></li>
        <li><Link to="/company">Company (static)</Link></li>
        <li><Link to="/kim">Kim (dynamic)</Link></li>
        <li><Link to="/chris">Chris (dynamic)</Link></li>
      </ul>

      {/*
          Sometimes you want to have a whitelist of static paths
          like "/about" and "/company" but also allow for dynamic
          patterns like "/:user". The problem is that "/about"
          is ambiguous and will match both "/about" and "/:user".
          Most routers have an algorithm to decide for you what
          it will match since they only allow you to match one
          "route". React Router lets you match in multiple places
          on purpose (sidebars, breadcrumbs, etc). So, when you
          want to clear up any ambiguous matching, and not match
          "/about" to "/:user", you can nest the static patterns
          inside the dynamic pattern and then use `Miss` to catch
          the patterns that don't match statically.
      */}
      <Match pattern="/:user" render={(matchProps) => (
        <div>
          <Match pattern="/about" component={About}/>
          <Match pattern="/company" component={Company}/>
          <Miss render={() => <User {...matchProps}/> }/>
        </div>
      )}/>
    </div>
  </Router>
)

const About = () => <h2>About</h2>

const Company = () => <h2>Company</h2>

const User = ({ params }) => (
  <div>
    <h2>User</h2>
    <div>{params.user}</div>
  </div>
)

export default AmbiguousExample
