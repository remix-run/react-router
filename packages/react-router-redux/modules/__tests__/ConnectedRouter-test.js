import React from 'react'
import renderer from 'react-test-renderer'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import createHistory from 'history/createMemoryHistory'

import ConnectedRouter from '../ConnectedRouter'
import { routerReducer } from '../reducer'

describe('A <ConnectedRouter>', () => {
  let store, history

  beforeEach(() => {
    store = createStore(combineReducers({
      router: routerReducer
    }))

    history = createHistory()
  })

  it('connects to a store via Provider', () => {
    expect(store.getState()).toHaveProperty('router.location.default', null)

    renderer.create(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <div>Test</div>
        </ConnectedRouter>
      </Provider>
    )

    expect(store.getState()).toHaveProperty('router.location.default.pathname')
  })

  it('connects to a store via props', () => {
    expect(store.getState()).toHaveProperty('router.location.default', null)

    renderer.create(
      <ConnectedRouter store={store} history={history}>
        <div>Test</div>
      </ConnectedRouter>
    )

    expect(store.getState()).toHaveProperty('router.location.default.pathname')
  })
  describe('with no namespace', () => {
    it('updates the store with location changes, setting to default namespace', () => {
      renderer.create(
        <ConnectedRouter store={store} history={history}>
          <div>Test</div>
        </ConnectedRouter>
      )

      expect(store.getState()).toHaveProperty('router.location.default.pathname', '/')

      history.push('/foo')

      expect(store.getState()).toHaveProperty('router.location.default.pathname', '/foo')
    })
  })

  describe('with namespace set', () => {
    it('updates the store with location changes, setting to the specified namespace', () => {
      renderer.create(
        <ConnectedRouter store={store} history={history} namespace={'inMemory'}>
          <div>Test</div>
        </ConnectedRouter>
      )

      expect(store.getState()).toHaveProperty('router.location.inMemory.pathname', '/')

      history.push('/foo')

      expect(store.getState()).toHaveProperty('router.location.inMemory.pathname', '/foo')
    })
  })

  describe('with children', () => {
    it('to render', () => {
      const tree = renderer.create(
        <ConnectedRouter store={store} history={history}>
          <div>Test</div>
        </ConnectedRouter>
      ).toJSON()

      expect(tree).toMatchSnapshot()
    })
  })

  describe('with no children', () => {
    it('to render', () => {
      const tree = renderer.create(
        <ConnectedRouter store={store} history={history} />
      ).toJSON()

      expect(tree).toMatchSnapshot()
    })
  })
})
