import expect, { createSpy } from 'expect'
import React, { PropTypes } from 'react'
import Link from '../Link'
import MemoryRouter from '../MemoryRouter'
import { render } from 'react-dom'
import { Simulate } from 'react-addons-test-utils'
import { LocationBroadcast } from '../Broadcasts'

const { click } = Simulate

const LinkInContext = ({ location, ...props}) => (
  <MemoryRouter initialEntries={[ location.pathname ]}>
    <Link {...props}/>
  </MemoryRouter>
)

describe('Link', () => {

  const requiredProps = {
    location: {
      pathname: '/'
    }
  }

  describe('to prop', () => {
    it('does not require context', () => {
      const div = document.createElement('div')
      render(<LinkInContext {...requiredProps} to="/foo"/>, div)
      expect(div.querySelector('a').getAttribute('href')).toEqual('/foo')
    })

    describe('with context.router', () => {
      const CONTEXT_HREF = 'CONTEXT_HREF'
      class TestRouterContext extends React.Component {
        static childContextTypes = {
          router: PropTypes.object
        }

        getChildContext() {
          return {
            router: {
              createHref: () => CONTEXT_HREF,
              blockTransitions: () => {},
              transitionTo: () => {},
              replaceWith: () => {}
            }
          }
        }

        render() {
          return (
            <LocationBroadcast value={{ pathname: '' }}>
              {this.props.children}
            </LocationBroadcast>
          )
        }
      }

      it('uses router.createHref to build the href', () => {
        const div = document.createElement('div')
        render((
          <TestRouterContext>
            <Link to={{}}/>
          </TestRouterContext>
        ), div)
        expect(div.querySelector('a').getAttribute('href')).toEqual(CONTEXT_HREF)
      })
    })
  })

  describe('style prop', () => {
    it('applies it', () => {
      const div = document.createElement('div')
      const PATHNAME = '/foo'
      render((
        <LinkInContext
          to={PATHNAME}
          location={{ pathname: PATHNAME }}
          style={{ color: 'red' }}
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.style.color).toEqual('red')
    })
  })

  describe('activeStyle', () => {
    describe('when active', () => {
      it('uses active styles', () => {
        const div = document.createElement('div')
        const PATHNAME = '/foo'
        render((
          <LinkInContext
            to={PATHNAME}
            location={{ pathname: PATHNAME }}
            activeStyle={{ color: 'red' }}
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.style.color).toEqual('red')
      })

      it('overrides previous styles found in both style and activeStyle', () => {
        const div = document.createElement('div')
        const PATHNAME = '/foo'
        render((
          <LinkInContext
            to={PATHNAME}
            location={{ pathname: PATHNAME }}
            style={{ color: 'blue' }}
            activeStyle={{ color: 'red' }}
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.style.color).toEqual('red')
      })

      it('continues to apply old styles not found in activeStyle', () => {
        const div = document.createElement('div')
        const PATHNAME = '/foo'
        render((
          <LinkInContext
            to={PATHNAME}
            location={{ pathname: PATHNAME }}
            style={{ background: 'blue' }}
            activeStyle={{ color: 'red' }}
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.style.background).toContain('blue')
      })
    })

    describe('when inactive', () => {
      it('does not use active styles', () => {
        const div = document.createElement('div')
        render((
          <LinkInContext
            to='/foo'
            location={{ pathname: '/' }}
            style={{ color: 'blue' }}
            activeStyle={{ color: 'red' }}
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.style.color).toEqual('blue')
      })
    })
  })

  describe('activeClassName', () => {
    it('is applied when active', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          to='/foo'
          location={{ pathname: '/foo' }}
          activeClassName="active"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })

    it('is not applied when inactive', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          to='/foo'
          location={{ pathname: '/' }}
          activeClassName="active"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('')
    })

    it('applies both className and activeClassName when active', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          to='/foo'
          location={{ pathname: '/foo' }}
          className="one"
          activeClassName="two"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('one two')
    })
  })

  describe('activeOnlyWhenExact', () => {
    it('is active when location matches exactly', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          activeOnlyWhenExact
          to='/foo'
          location={{ pathname: '/foo' }}
          activeClassName="active"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })

    it('is not active when location matches but not exactly', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          activeOnlyWhenExact
          to='/foo'
          location={{ pathname: '/foo/bar' }}
          activeClassName="active"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toNotEqual('active')
    })
  })

  describe('isActive', () => {
    describe('default', () => {
      it('isActive on partial matches', () => {
        const div = document.createElement('div')
        render((
          <LinkInContext
            to='/foo'
            location={{ pathname: '/foo/bar' }}
            activeClassName="active"
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.className).toEqual('active')
      })

      it('isActive on exact matches', () => {
        const div = document.createElement('div')
        render((
          <LinkInContext
            to='/foo'
            location={{ pathname: '/foo' }}
            activeClassName="active"
          />
        ), div)
        const a = div.querySelector('a')
        expect(a.className).toEqual('active')
      })
    })
  })

  describe('isActive prop', () => {
    it('is used', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          to='/foo'
          location={{ pathname: '/foo' }}
          isActive={(...args) => args.length === 3}
          activeClassName="active"
        />
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })
  })

  describe('accepts function as children', () => {
    it('renders the child component with isActive', () => {
      const div = document.createElement('div')
      render((
        <LinkInContext
          to='/foo'
          location={{ pathname: '/foo/bar' }}
        >
        {
          ({isActive}) => <a className={isActive ? 'active' : ''}>Test!</a>
        }
        </LinkInContext>
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })
  })

  describe('accepts a onClick handler', () => {
    const transitionSpy = createSpy()
    const clickEventData = {
      button: 0,
      defaultPrevented: false,
      preventDefault: function () {
        this.defaultPrevented = true
      }
    }
    class TestRouterContext extends React.Component {
      static childContextTypes = {
        router: PropTypes.object
      }

      getChildContext() {
        return {
          router: {
            createHref: () => 'CONTEXT_HREF',
            blockTransitions: () => {},
            transitionTo: transitionSpy,
            replaceWith: () => {}
          }
        }
      }

      render() {
        return (
          <LocationBroadcast value={{ pathname: '' }}>
            {this.props.children}
          </LocationBroadcast>
        )
      }
    }

    afterEach(() => {
      transitionSpy.reset()
    })

    it('calls both Link.handleClick and props.onClick', () => {
      const div = document.createElement('div')
      const customOnClick = createSpy()
      const link = <Link to='/foo' onClick={customOnClick} />
      render(<TestRouterContext>{link}</TestRouterContext>, div, () => {
        click(div.querySelector('a'), clickEventData)
        expect(customOnClick).toHaveBeenCalled()
        expect(transitionSpy).toHaveBeenCalled()
      })
    })

    it('does not call handleTransition when event has been prevented', () => {
      const div = document.createElement('div')
      const customOnClick = createSpy().andCall(e => e.preventDefault())
      const link = <Link to='/foo' onClick={customOnClick} />
      render(<TestRouterContext>{link}</TestRouterContext>, div, () => {
        click(div.querySelector('a'), clickEventData)
      })
      expect(customOnClick).toHaveBeenCalled()
      expect(transitionSpy).toNotHaveBeenCalled()
    })
  })
})
