import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import createMemoryHistory from 'history/createMemoryHistory'
import Router from '../Router'
import MemoryRouter from '../MemoryRouter'
import Switch from '../Switch'
import Route from '../Route'
import Redirect from '../Redirect'

describe('A <Switch>', () => {
  it('renders the first <Route> that matches the URL', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Route path="/two" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toMatch(/one/)
  })

  it('renders the first <Redirect from> that matches the URL', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/three' ]}>
        <Switch>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Redirect from="/four" to="/one"/>
          <Redirect from="/three" to="/two"/>
          <Route path="/two" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toMatch(/two/)
  })

  it('can use a `location` prop instead of `router.location`', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch location={{ pathname: '/two' }}>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Route path="/two" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toMatch(/two/)
  })

  it('does not render a second <Route> or <Redirect> that also matches the URL', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Redirect from="/one" to="/two"/>
          <Route path="/one" render={() => (
            <h1>two</h1>
          )}/>
          <Route path="/two" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotMatch(/two/)
  })

  it('does not remount a route', () => {
    const node = document.createElement('div')
    const history = createMemoryHistory({ initialEntries: ['/foo'] })

    let mountCount = 0

    class App extends React.Component {
      componentWillMount() { mountCount++ }
      render() { return <div /> }
    }

    ReactDOM.render((
      <Router history={history}>
        <Switch>
          <Route path="/foo" component={App}/>
          <Route path="/bar" component={App}/>
        </Switch>
      </Router>
    ), node)

    expect(mountCount).toBe(1)
    history.push('/bar')
    expect(mountCount).toBe(1)
    history.push('/foo')
    expect(mountCount).toBe(1)
  })

  it('renders pathless Routes', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/cupcakes' ]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>one</div>}/>
          <Route render={() => <div>two</div>}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain('one')
    expect(node.innerHTML).toContain('two')
  })

  it('handles from-less Redirects', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/cupcakes' ]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>bub</div>}/>
          <Redirect to="/bubblegum"/>
          <Route path="/cupcakes" render={() => <div>cup</div>}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain('cup')
    expect(node.innerHTML).toContain('bub')
  })
})
