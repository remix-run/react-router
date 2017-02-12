import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import createMemoryHistory from 'history/createMemoryHistory'
import Router from '../Router'
import Redirect from '../Redirect'

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

  it('works with relative paths', () => {
    const div = document.createElement('div')
    const REDIRECTED = 'REDIRECTED'
    const history = createHistoryMock()
    ReactDOM.render((
      <Router history={history}>
        <Redirect to={REDIRECTED} push={true}/>
      </Router>
    ), div, () => {
      const { pushes, replaces } = history.getResults()
      expect(pushes.length).toEqual(1)
      expect(pushes[0]).toEqual('/' + REDIRECTED)
      expect(replaces.length).toEqual(0)
    })
  })
})