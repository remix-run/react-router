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
    it('applies its activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
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
    it('does not apply its activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad' activeClassName='active'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
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
    it('applies active props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName='active'
            isActive={() => true}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })

    it('does not apply active props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName='active'
            isActive={() => false}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
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
      expect(a.className).toContain('active')
    })

    it('sets active value only for exact matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink exact to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })

    it('does not set active value for partial matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink exact to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })
  })

  describe('strict (enforce path\'s trailing slash)', () => {
    const PATH = '/pizza/'
    it('does not do strict matching by default', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to={PATH} activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })

    it('does not set active value when location.pathname has no trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink strict to={PATH} activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('sets active when pathname has trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/']}>
          <NavLink strict to={PATH} activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })
  })

})
