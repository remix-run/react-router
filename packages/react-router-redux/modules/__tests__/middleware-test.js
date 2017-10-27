import { push, namespacedPush, replace, namespacedReplace } from '../actions'
import routerMiddleware from '../middleware'

describe('routerMiddleware', () => {
  let history, next, dispatch

  describe('without namespace specified', () => {
    beforeEach(() => {
      history = {
        push: jest.fn(),
        replace: jest.fn()
      }
      next = jest.fn()

      dispatch = routerMiddleware(history)()(next)
    })

    it('calls the appropriate history method', () => {
      dispatch(push('/foo'))
      expect(history.push).toHaveBeenCalled()

      dispatch(replace('/foo'))
      expect(history.replace).toHaveBeenCalled()

      expect(next).toHaveBeenCalledTimes(0)
    })

    it('does not call history methods if action is namespaced', () => {
      dispatch(namespacedPush('namespaced')('/foo'))
      expect(history.push).toHaveBeenCalledTimes(0)

      dispatch(namespacedReplace('namespaced')('/foo'))
      expect(history.replace).toHaveBeenCalledTimes(0)

      expect(next).toHaveBeenCalled()
    })

    it('ignores other actions', () => {
      dispatch({ type: 'FOO' })
      expect(next).toHaveBeenCalled()
    })
  })

  describe('with namespace set', () => {
    beforeEach(() => {
      history = {
        push: jest.fn(),
        replace: jest.fn()
      }
      next = jest.fn()

      dispatch = routerMiddleware(history, 'a-namespace')()(next)
    })

    it('does not call history method if action is not namespaced', () => {
      dispatch(push('/foo'))
      expect(history.push).toHaveBeenCalledTimes(0)

      dispatch(replace('/foo'))
      expect(history.replace).toHaveBeenCalledTimes(0)

      expect(next).toHaveBeenCalled()
    })

    it('does not call history method if action’s namespace does not match middleware’s namespace', () => {
      dispatch(namespacedPush('anotherNamespace')('/foo'))
      expect(history.push).toHaveBeenCalledTimes(0)

      dispatch(namespacedReplace('anotherNamespace')('/foo'))
      expect(history.replace).toHaveBeenCalledTimes(0)

      expect(next).toHaveBeenCalled()
    })

    it('calls the appropriate history method if action’s namespace matchs middleware’s namespace', () => {
      dispatch(namespacedPush('a-namespace')('/foo'))
      expect(history.push).toHaveBeenCalled()

      dispatch(namespacedReplace('a-namespace')('/foo'))
      expect(history.replace).toHaveBeenCalled()

      expect(next).toHaveBeenCalledTimes(0)
    })

    it('ignores other actions', () => {
      dispatch({ type: 'FOO' })
      expect(next).toHaveBeenCalled()
    })
  })
})
