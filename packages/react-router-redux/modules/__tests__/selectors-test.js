import { getLocation, createMatchSelector } from '../selectors'
import { createStore, combineReducers } from 'redux'
import { routerReducer, LOCATION_CHANGE } from '../reducer'

describe('selectors', () => {

  let store, history

  beforeEach(() => {
    store = createStore(combineReducers({
      router: routerReducer
    }))
  })

  describe('getLocation', () => {
    it('gets the location from the state', () => {
      const location = { pathname: '/' }
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: location
      })
      const state = store.getState()
      expect(getLocation(state)).toEqual(location)
    })
  })

  describe('createMatchSelector', () => {
    it('matches correctly', () => {
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/' }
      })
      const state = store.getState()
      const matchSelector = createMatchSelector('/')
      expect(matchSelector(state)).toEqual({
        isExact: true,
        params: {},
        path: '/',
        url: '/'
      })
    })

    it('matches correctly', () => {
      const matchSelector = createMatchSelector('/')
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/test' }
      })
      const state = store.getState()
      expect(matchSelector(state)).toEqual({
        isExact: false,
        params: {},
        path: '/',
        url: '/'
      })
    })

    it('does not update if the match is the same', () => {
      const matchSelector = createMatchSelector('/')
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/test1' }
      })
      const match1 = matchSelector(store.getState())
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/test2' }
      })
      const match2 = matchSelector(store.getState())
      expect(match1).toBe(match2)
    })

    it('updates if the match is different', () => {
      const matchSelector = createMatchSelector('/sushi/:type')
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/sushi/california' }
      })
      const match1 = matchSelector(store.getState())
      store.dispatch({
        type: LOCATION_CHANGE,
        payload: { pathname: '/sushi/dynamite' }
      })
      const match2 = matchSelector(store.getState())
      expect(match1).not.toBe(match2)
    })
  })

})
