import expect from 'expect'
import React from 'react'
import Router from '../Router'
import ReactDOM from 'react-dom'

describe('A <Router>', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  describe('when it has more than one child', () => {
    it('throws an error explaining a Router can only have one child', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={{}}>
            <p>Foo</p>
            <p>Bar</p>
          </Router>,
          node
        )
      }).toThrow(/A <Router> may have only one child element/)
    })
  })

  describe('with exactly one child', () => {
    it('does not throw an error', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={{}}>
            <p>Bar</p>
          </Router>,
          node
        )
      }).toNotThrow()
    })
  })

  describe('with no children', () => {
    it('does not throw an error', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={{}} />,
          node
        )
      }).toNotThrow()
    })
  })
})
