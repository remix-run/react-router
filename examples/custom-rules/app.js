import React from 'react'
import { render } from 'react-dom'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link } from 'react-router'
import * as rules from 'react-router/rules'

const history = useBasename(createHistory)({
  basename: '/custom-rules'
})

class User extends React.Component {
  render() {
    let { userId } = this.props.params

    return (
      <div>
        <h1>User id: {userId}</h1>
        This is my profile page
      </div>
    )
  }
}

class Image extends React.Component {
  render() {
    let { userId, imageName } = this.props.params

    return (
      <div>
        <h1>User id: {userId} Images</h1>
        Showing picture {imageName}
      </div>
    )
  }
}

class Pizza extends React.Component {
  render() {
    const { size } = this.props.params
    const cost = size === 'small' ? 5
      : size === 'small' ? 8
      : 11

    return (
      <div>
        A {size} pizza ($ {cost})
      </div>
    )
  }
}

class Message extends React.Component {
  render() {
    const { messageId } = this.props.params

    return (
      <div>
        <h1>Message { messageId }</h1>
        Contents of message { messageId }
      </div>
    )
  }
}

class Images extends React.Component {
    render() {
      const { tags } = this.props.params
      return (
        <div>
          <h1>Viewing images with the following tags:</h1>
          <ul>
            {tags.map(tag => <li>{tag}</li>)}
          </ul>
        </div>
      )
    }
}

class App extends React.Component {

  render() {
    return (
      <div>
        <ul>
          <li><Link to="/user/123" activeClassName="active">valid route user/123</Link></li>
          <li><Link to="/user/bob" activeClassName="active">invalid route user/bob</Link></li>
          <li><Link to="/user/123/image/thumb.jpg" activeClassName="active">invalid route user/123/image/thumb.jpg</Link></li>
          <li><Link to="/user/123/image/thumb" activeClassName="active">invalid route user/123/image/thumb</Link></li>
          <li><Link to="/pizza/big" activeClassName="active">valid route /pizza/big</Link></li>
          <li><Link to="/pizza/red" activeClassName="active">invalid route /pizza/red</Link></li>
          <li><Link to="/message/XXXXX" activeClassName="active">invalid route /message/XXXXX</Link></li>
          <li><Link to="/message/XXXX" activeClassName="active">invalid route /message/XXXX</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
}

const image = rules.createRule({
  validate: (val => val.indexOf('.') !== -1)
})

const array = rules.createRule({
  regex: '(\\[(?:\\w+,)*\\w*\\])',
  convert: (v) => {
    let result = []
    let matcher = /(\w+)/g
    let match
    while((match = matcher.exec(v))) result.push(match[1])
    return result
  }
})

render((
  <Router history={history}>
    <Route path="/" component={App} >
      <Route path="pizza/:size"
        params={{ size: rules.any('small', 'medium', 'big') }}
        component={Pizza} />
      <Route path="message/:messageId"
        component={Message}
        params={{ messageId: rules.string({ length: 5 }) }} />
      <Route path="user/:userId"
        component={User}
        params={{ userId: rules.int() }} />
      <Route path="user/:userId/image/:imageName"
        component={Image}
        params={{ userId: rules.int(), imageName: image }} />
      <Route path="images/:tags"
        params={{ tags: array }}
        component={Images} />
    </Route>
  </Router>
), document.getElementById('example'))
