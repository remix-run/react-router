import expect from 'expect'
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

    expect(node.innerHTML).toNotMatch(/two/)
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

    expect(node.innerHTML).toNotContain('bub')
    expect(node.innerHTML).toContain('cup')
  })
})


describe('A <Switch location>', () => {
  it('can use a `location` prop instead of `router.location`', () => {
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/one' ]}>
        <Switch location={{ pathname: '/two' }}>
          <Route path="/one" render={() => <h1>one</h1>}/>
          <Route path="/two" render={() => <h1>two</h1>}/>
        </Switch>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toMatch(/two/)
  })

  describe('children', () => {
    it('passes location prop to matched <Route>', () => {
      const node = document.createElement('div')

      let propLocation
      const RouteHoneytrap = (props) => {
        propLocation = props.location
        return <Route {...props} />
      }

      const switchLocation = { pathname: '/two' } 
      ReactDOM.render((
        <MemoryRouter initialEntries={[ '/one' ]}>
          <Switch location={switchLocation}>
            <Route path="/one" render={() => <h1>one</h1>}/>
            <RouteHoneytrap path="/two" render={() => <h1>two</h1>}/>
          </Switch>
        </MemoryRouter>
      ), node)
      expect(propLocation).toEqual(switchLocation)
    })
  })
})
