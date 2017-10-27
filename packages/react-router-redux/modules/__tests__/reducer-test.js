import { LOCATION_CHANGE, routerReducer } from '../reducer'

describe('routerReducer', () => {
  describe('with namespace unset', () => {
    const state = {
      location: {
        default: {
          pathname: '/foo',
          action: 'POP'
        }
      }
    }

    it('updates the path', () => {
      expect(routerReducer(state, {
        type: LOCATION_CHANGE,
        payload: {
          location: {
            path: '/bar',
            action: 'PUSH'
          }
        }
      })).toEqual({
        location: {
          default: {
            path: '/bar',
            action: 'PUSH'
          }
        }
      })
    })

    it('works with initialState', () => {
      expect(routerReducer(undefined, {
        type: LOCATION_CHANGE,
        payload: {
          location: {
            path: '/bar',
            action: 'PUSH'
          }
        }
      })).toEqual({
        location: {
          default: {
            path: '/bar',
            action: 'PUSH'
          }
        }
      })
    })


    it('respects replace', () => {
      expect(routerReducer(state, {
        type: LOCATION_CHANGE,
        payload: {
          location: {
            path: '/bar',
            action: 'REPLACE'
          }
        }
      })).toEqual({
        location: {
          default: {
            path: '/bar',
            action: 'REPLACE'
          }
        }
      })
    })
  })
})
