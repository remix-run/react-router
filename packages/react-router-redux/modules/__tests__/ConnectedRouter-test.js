import React from 'react'
import renderer from 'react-test-renderer'
import {Switch, Route, Redirect} from 'react-router'
import { applyMiddleware, createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import createHistory from 'history/createMemoryHistory'

import ConnectedRouter from '../ConnectedRouter'
import { LOCATION_CHANGE, routerReducer } from '../reducer'
import routerMiddleware from '../middleware'
import { push } from '../actions'

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

  it('redirects properly', () => {
    expect(store.getState()).toHaveProperty('router.location', null)

    renderer.create(
      <ConnectedRouter store={store} history={history}>
        <Switch>
          <Route path="/test" render={() => null} />
          <Redirect to="/test" />
        </Switch>
      </ConnectedRouter>
    )

    expect(store.getState()).toHaveProperty('router.location.pathname', '/test')
  })

  it('stays in sync if other middlewares dispatch routerActions as a reaction to the inital LOCATION_CHANGE', () => {

    let waitingForFirstLocationChange = true
    const customMiddleware = st => next => action => {
      const res = next(action)
      if (waitingForFirstLocationChange && action.type === LOCATION_CHANGE) {
        waitingForFirstLocationChange = false
        st.dispatch(push('/test'))
      }
      return res
    }
    
    store = createStore(combineReducers({
      router: routerReducer
    }), applyMiddleware(routerMiddleware(history), customMiddleware))

    expect(store.getState()).toHaveProperty('router.location', null)

    renderer.create(
      <ConnectedRouter store={store} history={history} />
    )

    expect(store.getState()).toHaveProperty('router.location.pathname', '/test')
  })
})
