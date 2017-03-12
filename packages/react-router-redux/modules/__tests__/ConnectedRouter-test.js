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
    expect(store.getState()).toHaveProperty('router.location', null)

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
    expect(store.getState()).toHaveProperty('router.location', null)

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

  it('renders its children', () => {
    const tree = renderer.create(
      <ConnectedRouter store={store} history={history}>
        <div>Test</div>
      </ConnectedRouter>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
