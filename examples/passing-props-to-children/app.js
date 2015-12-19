import React from 'react'
import { render } from 'react-dom'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link, History } from 'react-router'

require('./app.css')

const history = useBasename(createHistory)({
  basename: '/passing-props-to-children'
})

const App = React.createClass({
  mixins: [ History ],

  getInitialState() {
    return {
      tacos: [
        { name: 'duck confit' },
        { name: 'carne asada' },
        { name: 'shrimp' }
      ]
    }
  },

  addTaco() {
    let name = prompt('taco name?')

    this.setState({
      tacos: this.state.tacos.concat({ name })
    })
  },

  handleRemoveTaco(removedTaco) {
    this.setState({
      tacos: this.state.tacos.filter(function (taco) {
        return taco.name != removedTaco
      })
    })

    this.history.push('/')
  },

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
})

const Taco = React.createClass({
  remove() {
    this.props.onRemoveTaco(this.props.params.name)
  },

  render() {
    return (
      <div className="Taco">
        <h1>{this.props.params.name}</h1>
        <button onClick={this.remove}>remove</button>
      </div>
    )
  }
})

render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="taco/:name" component={Taco} />
    </Route>
  </Router>
), document.getElementById('example'))
