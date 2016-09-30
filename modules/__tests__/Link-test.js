import expect from 'expect'
import React, { PropTypes } from 'react'
import Link from '../Link'
import { render } from 'react-dom'
import { LocationBroadcast } from '../locationBroadcast'

describe('Link', () => {

  const requiredProps = {
    location: {
      pathname: '/'
    }
  }

  describe('to prop', () => {
    it('does not require context', () => {
      const div = document.createElement('div')
      render(<Link {...requiredProps} to="/foo"/>, div)
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
          return this.props.children
        }
      }

      it('uses router.createHref to build the href', () => {
        const div = document.createElement('div')
        render((
          <TestRouterContext>
            <Link {...requiredProps} to={{}}/>
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
        <Link
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
          <Link
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
          <Link
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
          <Link
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
          <Link
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
        <Link
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
        <Link
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
        <Link
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
        <Link
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
        <Link
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
          <Link
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
          <Link
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
        <Link
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

  describe('when rendered in context of a location', () => {
    it('uses the location from context', () => {
      const PATHNAME = '/PATHNAME'
      const div = document.createElement('div')
      const location = { pathname: PATHNAME, search: '', hash: '' }
      render((
        <LocationBroadcast value={location}>
          <Link
            to={PATHNAME}
            activeClassName="active"
          />
        </LocationBroadcast>
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })
  })

  describe('accepts function as children', () => {
    it('renders the child component with isActive', () => {
      const div = document.createElement('div')
      render((
        <Link
          to='/foo'
          location={{ pathname: '/foo/bar' }}
        >
        {
          ({isActive}) => <a className={isActive ? 'active' : ''}>Test!</a>
        }
        </Link>
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })
  })
})
