import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import { Simulate } from 'react-addons-test-utils'
import createMemoryHistory from 'history/createMemoryHistory'
import MemoryRouter from '../MemoryRouter'
import Router from '../Router'
import Prompt from '../Prompt'
import Redirect from '../Redirect'
import Route from '../Route'
import Switch from '../Switch'

describe('Integration Tests', () => {
  it('renders nested matches', () => {
    const node = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/nested' ]}>
        <Route path="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Route path="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </MemoryRouter>
    ), node)
    expect(node.innerHTML).toContain(TEXT1)
    expect(node.innerHTML).toContain(TEXT2)
  })

  it('renders only as deep as the matching Route', () => {
    const node = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Route path="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </MemoryRouter>
    ), node)
    expect(node.innerHTML).toContain(TEXT1)
    expect(node.innerHTML).toNotContain(TEXT2)
  })

  it('renders multiple matching routes', () => {
    const node = document.createElement('div')
    const TEXT1 = 'Mrs. Schiffman'
    const TEXT2 = 'Mrs. Burton'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/double' ]}>
        <div>
          <aside>
            <Route path="/double" render={() => (
              <h1>{TEXT1}</h1>
            )}/>
          </aside>
          <main>
            <Route path="/double" render={() => (
              <h1>{TEXT2}</h1>
            )}/>
          </main>
        </div>
      </MemoryRouter>
    ), node)
    expect(node.innerHTML).toContain(TEXT1)
    expect(node.innerHTML).toContain(TEXT2)
  })

  //describe('Ambiguous matches', () => {
  //  const leftClickEvent = {
  //    defaultPrevented: false,
  //    preventDefault() { this.defaultPrevented = true },
  //    metaKey: null,
  //    altKey: null,
  //    ctrlKey: null,
  //    shiftKey: null,
  //    button: 0
  //  }

  //  it('allows matching sequentially to disambiguate', () => {
  //    const node = document.createElement('div')
  //    ReactDOM.render((
  //      <MemoryRouter initialEntries={[ '/' ]}>
  //        <div>
  //          <Link id="root" to="/">Root</Link>
  //          <Link id="static" to="/static">Static</Link>
  //          <Link id="dynamic" to="/dynamic">Dynamic</Link>

  //          <Route exact path="/" render={() => <div>root component</div>}/>
  //          <Switch>
  //            <Route path="/static" render={() => <div>static component</div>}/>
  //            <Route path="/:name" render={({ match: { params } }) => (
  //              <div>{`${params.name} component`}</div>
  //            )}/>
  //          </Switch>
  //        </div>
  //      </MemoryRouter>
  //    ), node)
  //    expect(node.innerHTML).toNotContain('static component')
  //    expect(node.innerHTML).toNotContain('dynamic component')
  //    expect(node.innerHTML).toContain('root component')

  //    Simulate.click(node.querySelector('#dynamic'), leftClickEvent)
  //    expect(node.innerHTML).toNotContain('static component')
  //    expect(node.innerHTML).toNotContain('root component')
  //    expect(node.innerHTML).toContain('dynamic component')

  //    Simulate.click(node.querySelector('#root'), leftClickEvent)
  //    expect(node.innerHTML).toNotContain('static component')
  //    expect(node.innerHTML).toNotContain('dynamic component')
  //    expect(node.innerHTML).toContain('root component')

  //    Simulate.click(node.querySelector('#dynamic'), leftClickEvent)
  //    expect(node.innerHTML).toNotContain('static component')
  //    expect(node.innerHTML).toNotContain('root component')
  //    expect(node.innerHTML).toContain('dynamic component')
  //  })
  //})

  //describe('clicking around', () => {
  //  const leftClickEvent = {
  //    defaultPrevented: false,
  //    preventDefault() { this.defaultPrevented = true },
  //    metaKey: null,
  //    altKey: null,
  //    ctrlKey: null,
  //    shiftKey: null,
  //    button: 0
  //  }

  //  it('navigates', () => {
  //    const node = document.createElement('div')
  //    const TEXT1 = 'I AM PAGE 1'
  //    ReactDOM.render((
  //      <MemoryRouter>
  //        <div>
  //          <Link id="one" to="/one">One</Link>
  //          <Route path="/one" render={() => (
  //            <h1>{TEXT1}</h1>
  //          )}/>
  //        </div>
  //      </MemoryRouter>
  //    ), node)
  //    expect(node.innerHTML).toNotContain(TEXT1)

  //    Simulate.click(node.querySelector('#one'), leftClickEvent)
  //    expect(node.innerHTML).toContain(TEXT1)
  //  })
  //})

  describe('Prompt', () => {
    const TEXT = 'TEXT'
    const leftClickEvent = {
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true },
      metaKey: null,
      altKey: null,
      ctrlKey: null,
      shiftKey: null,
      button: 0
    }

    // TODO
    it.skip('Prompts the user to allow a transition', () => {
      const node = document.createElement('div')
      let message
      ReactDOM.render((
        <MemoryRouter
          getUserConfirmation={(_message) => message = _message}
        >
          <div>
            <Link to="/somewhere-else" id="link"/>
            <Prompt message={TEXT}/>
          </div>
        </MemoryRouter>
      ), node)
      Simulate.click(node.querySelector('a'), leftClickEvent)
      expect(message).toEqual(TEXT)
    })
  })
})
