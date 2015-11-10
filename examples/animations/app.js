import React from 'react'
import { render } from 'react-dom'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import StaticContainer from 'react-static-container'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link } from 'react-router'

require('./app.css')

const history = useBasename(createHistory)({
  basename: '/animations'
})

/**
 * <RouteCSSTransitionGroup> renders twice on a route change. On the first
 * render, it "freezes" the transitioning-out component by setting
 * `shouldUpdate` on the <StaticContainer> to `false`. This prevents any
 * <Link>s nested under the old component from updating their active state to
 * reflect the new location, to allow for a smooth transition out. It then
 * renders the new, transitioning-in component immediately afterward.
 */
class RouteCSSTransitionGroup extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      previousPathname: null
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextContext.location.pathname !== this.context.location.pathname) {
      this.setState({ previousPathname: this.context.location.pathname })
    }
  }

  render() {
    const { children, ...props } = this.props
    const { previousPathname } = this.state

    return (
      <ReactCSSTransitionGroup {...props}>
        <StaticContainer
          key={previousPathname || this.context.location.pathname}
          shouldUpdate={!previousPathname}
        >
          {children}
        </StaticContainer>
      </ReactCSSTransitionGroup>
    )
  }

  componentDidUpdate() {
    if (this.state.previousPathname) {
      this.setState({ previousPathname: null })
    }
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <ul>
          <li><Link to="/page1">Page 1</Link></li>
          <li><Link to="/page2">Page 2</Link></li>
        </ul>
        <RouteCSSTransitionGroup
          component="div" transitionName="example"
          transitionEnterTimeout={500} transitionLeaveTimeout={500}
        >
          {this.props.children}
        </RouteCSSTransitionGroup>
      </div>
    )
  }
}

class Page1 extends React.Component {
  render() {
    return (
      <div className="Image">
        <h1>Page 1</h1>
        <p><Link to="/page1" activeClassName="link-active">A link to page 1 should be active</Link>. Lorem ipsum dolor sit amet, consectetur adipisicing elit. <Link to="/page2" activeClassName="link-active">A link to page 2 should be inactive</Link>. Do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    )
  }
}

class Page2 extends React.Component {
  render() {
    return (
      <div className="Image">
        <h1>Page 2</h1>
        <p>Consectetur adipisicing elit, sed do <Link to="/page2" activeClassName="link-active">a link to page 2 should also be active</Link> eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    )
  }
}

render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="page1" component={Page1} />
      <Route path="page2" component={Page2} />
    </Route>
  </Router>
), document.getElementById('example'))
