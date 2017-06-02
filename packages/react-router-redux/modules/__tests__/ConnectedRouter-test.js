import React from 'react'
import renderer from 'react-test-renderer'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import createHistory from 'history/createMemoryHistory'
import { ActionCreators, instrument } from 'redux-devtools'

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
    expect(store.getState()).toHaveProperty('router.location', {})

    renderer.create(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <div>Test</div>
        </ConnectedRouter>
      </Provider>
    )

    expect(store.getState()).toHaveProperty('router.location.pathname')
  })

  it('connects to a store via props', () => {
    expect(store.getState()).toHaveProperty('router.location', {})

    renderer.create(
      <ConnectedRouter store={store} history={history}>
        <div>Test</div>
      </ConnectedRouter>
    )

    expect(store.getState()).toHaveProperty('router.location.pathname')
  })

  it('updates the store with location changes', () => {
    renderer.create(
      <ConnectedRouter store={store} history={history}>
        <div>Test</div>
      </ConnectedRouter>
    )

    expect(store.getState()).toHaveProperty('router.location.pathname', '/')

    history.push('/foo')

    expect(store.getState()).toHaveProperty('router.location.pathname', '/foo')
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

  describe('Redux DevTools', () => {
    let devToolsStore

    beforeEach(() => {
      // Set initial URL before syncing
      history.push('/foo')

      store = createStore(
        combineReducers({
          router: routerReducer
        }),
        instrument()
      )
      devToolsStore = store.liftedStore
    })

    it('resets to the initial url', () => {
      renderer.create(
        <ConnectedRouter store={store} history={history}>
          <div>Test</div>
        </ConnectedRouter>
      )

      let currentPath
      const historyUnsubscribe = history.listen(location => {
        currentPath = location.pathname
      })

      history.push('/bar')
      devToolsStore.dispatch(ActionCreators.reset())

      expect(currentPath).toEqual('/foo')

      historyUnsubscribe()
    })

    it('handles toggle after history change', () => {
      renderer.create(
        <ConnectedRouter store={store} history={history}>
          <div>Test</div>
        </ConnectedRouter>
      )

      let currentPath
      const historyUnsubscribe = history.listen(location => {
        currentPath = location.pathname
      })

      history.push('/foo2') // DevTools action #2
      history.push('/foo3') // DevTools action #3

      // When we toggle an action, the devtools will revert the action
      // and we therefore expect the history to update to the previous path
      devToolsStore.dispatch(ActionCreators.toggleAction(3))
      expect(currentPath).toEqual('/foo2')

      historyUnsubscribe()
    })
  })
})
