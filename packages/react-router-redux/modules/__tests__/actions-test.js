import {
  CALL_HISTORY_METHOD,
  push, replace, go, goBack, goForward,
  namespacedPush, namespacedReplace, namespacedGo, namespacedGoBack, namespacedGoForward
} from '../actions'

describe('routerActions', () => {
  describe('push', () => {
    it('creates actions', () => {
      expect(push('/foo')).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'push',
          args: [ '/foo' ]
        }
      })

      expect(push({ pathname: '/foo', state: { the: 'state' } })).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'push',
          args: [ {
            pathname: '/foo',
            state: { the: 'state' }
          } ]
        }
      })

      expect(push('/foo', 'baz', 123)).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'push',
          args: [ '/foo' , 'baz', 123 ]
        }
      })
    })
  })

  describe('replace', () => {
    it('creates actions', () => {
      expect(replace('/foo')).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'replace',
          args: [ '/foo' ]
        }
      })

      expect(replace({ pathname: '/foo', state: { the: 'state' } })).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'replace',
          args: [ {
            pathname: '/foo',
            state: { the: 'state' }
          } ]
        }
      })
    })
  })

  describe('go', () => {
    it('creates actions', () => {
      expect(go(1)).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'go',
          args: [ 1 ]
        }
      })
    })
  })

  describe('goBack', () => {
    it('creates actions', () => {
      expect(goBack()).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'goBack',
          args: []
        }
      })
    })
  })

  describe('goForward', () => {
    it('creates actions', () => {
      expect(goForward()).toEqual({
        type: CALL_HISTORY_METHOD,
        payload: {
          method: 'goForward',
          args: []
        }
      })
    })
  })

  describe('namespaced actions', () => {
    describe('namespacedPush', () => {
      it('returns a function which creates actions with namespace', () => {
        const action = namespacedPush('bar')
        expect(action('/foo')).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'push',
            args: [ '/foo' ],
            namespace: 'bar'
          }
        })

        expect(action({ pathname: '/foo', state: { the: 'state' } })).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'push',
            args: [ {
              pathname: '/foo',
              state: { the: 'state' }
            } ],
            namespace: 'bar'
          }
        })

        expect(action('/foo', 'baz', 123)).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'push',
            args: [ '/foo' , 'baz', 123 ],
            namespace: 'bar'
          }
        })
      })
    })

    describe('namespacedReplace', () => {
      it('returns a function which creates actions with namespace', () => {
        const action = namespacedReplace('bar-replace')

        expect(action('/foo')).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'replace',
            args: [ '/foo' ],
            namespace: 'bar-replace'
          }
        })

        expect(action({ pathname: '/foo', state: { the: 'state' } })).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'replace',
            args: [ {
              pathname: '/foo',
              state: { the: 'state' }
            } ],
            namespace: 'bar-replace'
          }
        })
      })
    })

    describe('namespacedGo', () => {
      it('returns a function which creates actions with namespace', () => {
        const action = namespacedGo('bar-go')

        expect(action(1)).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'go',
            args: [ 1 ],
            namespace: 'bar-go',
          }
        })
      })
    })

    describe('namespacedGoBack', () => {
      it('returns a function which creates actions with namespace', () => {
        const action = namespacedGoBack('bar-back')

        expect(action()).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'goBack',
            args: [],
            namespace: 'bar-back',
          }
        })
      })
    })

    describe('namespacedGoForward', () => {
      it('returns a function which creates actions with namespace', () => {
        const action = namespacedGoForward('bar-forward')

        expect(action()).toEqual({
          type: CALL_HISTORY_METHOD,
          payload: {
            method: 'goForward',
            args: [],
            namespace: 'bar-forward',
          }
        })
      })
    })
  })
})
