import { push, replace } from '../actions'
import routerMiddleware from '../middleware'

describe('routerMiddleware', () => {
  let history, next, dispatch

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

  it('ignores other actions', () => {
    dispatch({ type: 'FOO' })
    expect(next).toHaveBeenCalled()
  })
})
