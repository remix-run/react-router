import React from 'react'
import ReactDOM from 'react-dom'
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

    expect(node.innerHTML).not.toMatch(/two/)
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

    expect(node.innerHTML).not.toContain('one')
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

    expect(node.innerHTML).not.toContain('cup')
    expect(node.innerHTML).toContain('bub')
  })

  it('handles subsequent redirects', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch>
          <Redirect exact from="/one" to="/two"/>
          <Redirect exact from="/two" to="/three"/>

          <Route path="/three" render={() => <div>three</div>}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain('three')
  })

  it('handles comments', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/cupcakes' ]}>
        <Switch>
          <Route path="/bubblegum" render={() => <div>bub</div>}/>
          {/* this is a comment */}
          <Route path="/cupcakes" render={() => <div>cup</div>}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).not.toContain('bub')
    expect(node.innerHTML).toContain('cup')
  })

  it('renders with non-element children', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch>
          <Route path="/one" render={() => (<h1>one</h1>)}/>
          {false}
          {undefined}
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toMatch(/one/)
  })

  it('throws with no <Router>', () => {
    const node = document.createElement('div')

    spyOn(console, 'error')

    expect(() => {
      ReactDOM.render((
        <Switch>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Route path="/two" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      ), node)
    }).toThrow(/You should not use <Switch> outside a <Router>/)

    expect(console.error.calls.count()).toBe(1)
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'The context `router` is marked as required in `Switch`'
    )
  })
})
