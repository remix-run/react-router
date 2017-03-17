import { push, replace } from '../actions'
import routerMiddleware from '../middleware'
import { LOCATION_CHANGE } from '../reducer'

describe('routerMiddleware', () => {
  let history, next, dispatch, middleware, listener, storeDispatch

  beforeEach(() => {
    history = {
      push: jest.fn(),
      replace: jest.fn(),
      listen: jest.fn().mockImplementation(arg => listener = arg)
    }
    next = jest.fn()

    storeDispatch = jest.fn()
    middleware = routerMiddleware(history)
    dispatch = middleware({ dispatch: storeDispatch })(next)
  })


  it('calls the appropriate history method', () => {
    dispatch(push('/foo'))
    expect(history.push).toHaveBeenCalled()

    dispatch(replace('/foo'))
    expect(history.replace).toHaveBeenCalled()

    expect(next).toHaveBeenCalledTimes(0)
  })

  it('ignores other actions', () => {
    dispatch({ type: 'FOO' })
    expect(next).toHaveBeenCalled()
  })

  it('dispatches change actions on history change', () => {
    expect(history.listen).toHaveBeenCalledTimes(1)
    expect(typeof listener).toBe('function')
    const location = {
      pathname: '/testpath',
      search: '',
      hash: '',
      key: 'abc123'
    }
    listener(location)
    expect(storeDispatch).toHaveBeenCalledWith({
      type: LOCATION_CHANGE,
      payload: location
    })
  })
})
