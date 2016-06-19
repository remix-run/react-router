import expect from 'expect'
import React from 'react'
//import Match from '../Match'
import Router from '../Router'
import { renderToString } from 'react-dom/server'
import createMemoryHistory from 'history/lib/createMemoryHistory'

describe('Router', () => {

  describe('rendering', () => {
    it('renders static children', () => {
      expect(renderToString(
        <Router history={createMemoryHistory()}>
          <div>test</div>
        </Router>
      )).toContain('test')
    })

    it('passes match props to a children-as-function prop', () => {
      let actualProps
      renderToString(
        <Router history={createMemoryHistory([ '/lol' ])}>
          {(props) => <div>{(actualProps = props, null)}</div>}
        </Router>
      )
      expect(actualProps).toEqual({
        isTerminal: false,
        location: {
          action: 'POP',
          hash: '',
          key: null,
          pathname: '/lol',
          search: '',
          state: undefined
        },
        params: null,
        pathname: '/',
        pattern: '/'
      })
    })
  })

})

