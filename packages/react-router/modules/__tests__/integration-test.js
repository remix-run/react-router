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

  it('renders root Route', () => {
    const div = document.createElement('div')
    const TEXT = 'Mrs. Kato'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT)
  })

  it('does not render a route that doesn\'t match', () => {
    const div = document.createElement('div')
    const TEXT = 'bubblegum'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bunnies' ]}>
        <Route path="/flowers" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toNotContain(TEXT)
  })


  it('renders nested matches', () => {
    const div = document.createElement('div')
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
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
  })

  it('renders only as deep as the matching Route', () => {
    const div = document.createElement('div')
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
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toNotContain(TEXT2)
  })

  it('renders multiple matching routes', () => {
    const div = document.createElement('div')
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
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
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
  //    const div = document.createElement('div')
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
  //    ), div)
  //    expect(div.innerHTML).toNotContain('static component')
  //    expect(div.innerHTML).toNotContain('dynamic component')
  //    expect(div.innerHTML).toContain('root component')

  //    Simulate.click(div.querySelector('#dynamic'), leftClickEvent)
  //    expect(div.innerHTML).toNotContain('static component')
  //    expect(div.innerHTML).toNotContain('root component')
  //    expect(div.innerHTML).toContain('dynamic component')

  //    Simulate.click(div.querySelector('#root'), leftClickEvent)
  //    expect(div.innerHTML).toNotContain('static component')
  //    expect(div.innerHTML).toNotContain('dynamic component')
  //    expect(div.innerHTML).toContain('root component')

  //    Simulate.click(div.querySelector('#dynamic'), leftClickEvent)
  //    expect(div.innerHTML).toNotContain('static component')
  //    expect(div.innerHTML).toNotContain('root component')
  //    expect(div.innerHTML).toContain('dynamic component')
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
  //    const div = document.createElement('div')
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
  //    ), div)
  //    expect(div.innerHTML).toNotContain(TEXT1)

  //    Simulate.click(div.querySelector('#one'), leftClickEvent)
  //    expect(div.innerHTML).toContain(TEXT1)
  //  })
  //})

  describe('Switch', () => {
    it('renders pathless Routes', () => {
      const div = document.createElement('div')
      const FOO = '/cupcakes'
      const MISS = '/grown-up-onsie'
      ReactDOM.render((
        <MemoryRouter initialEntries={[ MISS ]}>
          <Switch>
            <Route path={FOO} render={() => <div>{FOO}</div>}/>
            <Route render={() => <div>{MISS}</div>}/>
          </Switch>
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toNotContain(FOO)
      expect(div.innerHTML).toContain(MISS)
    })

    it('renders the first matching Route', () => {
      const div = document.createElement('div')
      const FOO = '/cupcakes'
      const MISS = '/grown-up-onsie'
      ReactDOM.render((
        <MemoryRouter initialEntries={[ FOO ]}>
          <Switch>
            <Route path={FOO} render={() => <div>{FOO}</div>}/>
            <Route render={() => <div>{MISS}</div>}/>
          </Switch>
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toContain(FOO)
      expect(div.innerHTML).toNotContain(MISS)
    })
  })

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
      const div = document.createElement('div')
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
      ), div)
      Simulate.click(div.querySelector('a'), leftClickEvent)
      expect(message).toEqual(TEXT)
    })
  })

  describe('Redirect', () => {
    const createHistoryMock = () => {
      const pushes = []
      const replaces = []
      const history = createMemoryHistory()
      history.push = (loc) => pushes.push(loc)
      history.replace = (loc) => replaces.push(loc)
      history.getResults = () => ({ replaces, pushes })
      return history
    }

    it('replaces the current URL', (done) => {
      const div = document.createElement('div')
      const REDIRECTED = '/REDIRECTED'
      const history = createHistoryMock()

      ReactDOM.render((
        <Router history={history}>
          <Redirect to={REDIRECTED}/>
        </Router>
      ), div, () => {
        const { pushes, replaces } = history.getResults()
        expect(pushes.length).toEqual(0)
        expect(replaces.length).toEqual(1)
        expect(replaces[0]).toEqual(REDIRECTED)
        done()
      })
    })

    it('pushes a new URL with push', () => {
      const div = document.createElement('div')
      const REDIRECTED = '/REDIRECTED'
      const history = createHistoryMock()
      ReactDOM.render((
        <Router history={history}>
          <Redirect to={REDIRECTED} push={true}/>
        </Router>
      ), div, () => {
        const { pushes, replaces } = history.getResults()
        expect(pushes.length).toEqual(1)
        expect(pushes[0]).toEqual(REDIRECTED)
        expect(replaces.length).toEqual(0)
      })
    })
  })
})
