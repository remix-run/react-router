import { getLocation, createMatchSelector } from '../selectors'
import { createStore, combineReducers } from 'redux'
import { routerReducer, LOCATION_CHANGE } from '../reducer'

describe('selectors', () => {

  let store

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
      expect(getLocation(state)).toBe(location)
    })
  })

  describe('createMatchSelector', () => {
    it('matches correctly if the router is initialized', () => {
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
    
    it('does not throw error if router has not yet initialized', () => {
      const matchSelector = createMatchSelector('/')
      const state = store.getState()
      expect(() => matchSelector(state)).not.toThrow()
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
