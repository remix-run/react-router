import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from 'react-router/MemoryRouter'
import NavLink from '../NavLink'

describe('NavLink', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  describe('When a <NavLink> is active', () => {
    it('applies its default activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('applies its passed activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toEqual('selected')
    })

    it('applies its activeStyle', () => {
      const defaultStyle = { color: 'black' }
      const activeStyle = { color: 'red' }

      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            style={defaultStyle}
            activeStyle={activeStyle}
          >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.style.color).toBe(activeStyle.color)
    })
  })

  describe('When a <NavLink> is not active', () => {
    it('does not apply its default activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('does not apply its passed activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad' activeClassName='selected'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toNotContain('selected')
    })

    it('does not apply its activeStyle', () => {
      const defaultStyle = { color: 'black' }
      const activeStyle = { color: 'red' }

      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/salad'
            style={defaultStyle}
            activeStyle={activeStyle}
            >
            Salad?
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.style.color).toBe(defaultStyle.color)
    })
  })

  describe('isActive', () => {
    it('applies active default props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            isActive={() => true}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('applies active passed props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName="selected"
            isActive={() => true}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toEqual('selected')
    })

    it('does not apply active default props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            isActive={() => false}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('does not apply active passed props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName="selected"
            isActive={() => false}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toNotContain('selected')
    })
  })

  describe('exact', () => {
    it('does not do exact matching by default', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active default value only for exact matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink exact to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active passed value only for exact matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink exact to='/pizza' activeClassName="selected">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toEqual('selected')
    })

    it('does not set active default value for partial matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink exact to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('does not set active passed value for partial matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink exact to='/pizza' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toNotContain('selected')
    })
  })

  describe('strict (enforce path\'s trailing slash)', () => {
    const PATH = '/pizza/'
    it('does not do strict matching by default', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('does not set active default value when location.pathname has no trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink strict to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('does not set active passed value when location.pathname has no trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink strict to={PATH} activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toNotContain('selected')
    })

    it('sets active default value when pathname has trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/']}>
          <NavLink strict to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active passed value when pathname has trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/']}>
          <NavLink strict to={PATH} activeClassName="selected">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toEqual('selected')
    })
  })

  describe('location property', () => {
    it('overrides the current location', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pasta' activeClassName='selected' location={{pathname: '/pasta'}}>Pasta!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toContain('selected')
    })
    
    it('is not overwritten by the current location', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pasta']}>
          <NavLink to='/pasta' activeClassName='selected' location={{pathname: '/pizza'}}>Pasta!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active').toNotContain('selected')
    })
  })
})
