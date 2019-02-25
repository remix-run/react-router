import React, { Component } from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link, withRouter } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'

import './app.css'

class AppBase extends Component {
  state = {
    tacos: [
      { name: 'duck confit' },
      { name: 'carne asada' },
      { name: 'shrimp' }
    ]
  }

  addTaco = () => {
    let name = prompt('taco name?')

    this.setState({
      tacos: this.state.tacos.concat({ name })
    })
  }

  handleRemoveTaco = (removedTaco) => {
    this.setState({
      tacos: this.state.tacos.filter(function (taco) {
        return taco.name != removedTaco
      })
    })

    this.props.router.push('/')
  }

  render() {
    let links = this.state.tacos.map(function (taco, i) {
      return (
        <li key={i}>
          <Link to={`/taco/${taco.name}`}>{taco.name}</Link>
        </li>
      )
    })

    return (
      <div className="App">
        <button onClick={this.addTaco}>Add Taco</button>
        <ul className="Master">
          {links}
        </ul>
        <div className="Detail">
          {this.props.children && React.cloneElement(this.props.children, {
            onRemoveTaco: this.handleRemoveTaco
          })}
        </div>
      </div>
    )
  }
}
const App = withRouter(AppBase)

class Taco extends Component {
  remove = () => {
    this.props.onRemoveTaco(this.props.params.name)
  }

  render() {
    return (
      <div className="Taco">
        <h1>{this.props.params.name}</h1>
        <button onClick={this.remove}>remove</button>
      </div>
    )
  }
}

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <Route path="taco/:name" component={Taco} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))
