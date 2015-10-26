import React from 'react'
import { render } from 'react-dom'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link } from 'react-router'

const history = useBasename(createHistory)({
  basename: '/custom-rules'
})

class User extends React.Component {
  render() {
    let { userID } = this.props.params

    return (
      <div className="User">
        <h1>User id: {userID}</h1>
        This is my profile page
      </div>
    )
  }
}

class Image extends React.Component {
  render() {
    let { userID, imageName } = this.props.params

    return (
      <div className="Image">
        <h1>User id: {userID} Images</h1>
        Showing picture {imageName}
      </div>
    )
  }
}

class App extends React.Component {

  // very basic custom rule
  imageRule(param) {
    return param.indexOf('.') !== -1
  }

  render() {
    return (
      <div>
        <ul>
          <li><Link to="/user/123" activeClassName="active">valid route user/123</Link></li>
          <li><Link to="/user/bob" activeClassName="active">invalid route user/bob</Link></li>
          <li><Link to="/user/123/image/thumb.jpg" activeClassName="active">invalid route user/123/image/thumb.jpg</Link></li>
          <li><Link to="/user/123/image/thumb" activeClassName="active">invalid route user/123/image/thumb</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
}

render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="user/<string:userID>" component={User} />
      <Route path="user/:userID/image/<imageRule:imageName>" component={Image} />
    </Route>
  </Router>
), document.getElementById('example'))
