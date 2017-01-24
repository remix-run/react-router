import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import Switch from '../Switch'
import Route from '../Route'

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

  it('does not render a second <Route> that also matches the URL', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch>
          <Route path="/one" render={() => (
            <h1>one</h1>
          )}/>
          <Route path="/one" render={() => (
            <h1>two</h1>
          )}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotMatch(/two/)
  })
})
